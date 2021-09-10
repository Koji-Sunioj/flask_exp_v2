from flask import Flask, redirect, url_for, request,json,session,render_template,jsonify
from werkzeug.utils import secure_filename
import re
from functions import get_weather,make_calendar,home_dashboard,thread_page,ago,get_page,make_day,tax_year_header,mysql_to_python_days
from google_get import main,create_event,delete_event,edit_event
import db_functions
import datetime
import pandas as pd
import numpy as np
import json
from pandas.tseries.offsets import DateOffset
import requests
import re
import os
from PIL import Image
import math
import pymysql
from dateutil.relativedelta import relativedelta
from datetime import datetime,date,timedelta
con = pymysql.connect('localhost', 'root', '(hidden)', '(hidden)')


from geopy.geocoders import Nominatim
geolocator = Nominatim(user_agent="ironpond")

#export FLASK_ENV=development

UPLOAD_FOLDER = '/home/kokogabriel/Desktop/Python/flask_projects/flask_exp_fix/static/storage'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'ironpond'

@app.after_request
def add_header(response):
    response.cache_control.max_age = 0
    return response

@app.route('/login/', methods = ['POST', 'GET'])
def login_page():
	if request.method == 'POST':
		email_username = request.form['email_username']
		password = request.form['password']
		data = db_functions.check_user(email_username,password)
		session.permanent = True
		session['username'] = data[0]
		session['hometown'] = data[2].split(',')[0]
		session['log_time'] = datetime.now()
		session['role'] = data[3]
		message = '{} succesfully logged in!'.format(session['username'])
		session['message'] = message
		return redirect(url_for('index'))
	return render_template('login.html')
	

@app.route('/user_validation', methods=['POST'])
def user_validation():
	email_username = request.form['email_username']
	password = request.form['password']
	data = db_functions.check_user(email_username,password)
	if not data:
		return jsonify({'error':'no user found'})
	return jsonify({'success':'user found'})

@app.route('/create_profile/', methods = ['POST', 'GET'])
def create_profile():
	if request.method == 'POST':
		email = request.form['email']
		username = request.form['username']
		home_town = request.form['home_town']
		password = request.form['password']
		db_functions.create_new_user(username,email,home_town,password)
		message = 'username {} was succesfully created. now logged in!'.format(username)
		session.permanent = True
		session['username'] = username
		session['message'] = message
		session['hometown'] = home_town
		session['log_time'] = datetime.now()
		return redirect(url_for('index'))
	return render_template('create_profile.html')


@app.route('/profile_validation', methods=['POST'])
def profile_validation():
	username = request.form['username']
	email = request.form['email']
	data = db_functions.check_new_user(email,username)
	if data:
		return jsonify({'error':'that email or username is taken. please use a different one.'})
	return jsonify({'success':'looks good'})

@app.route("/<username>/",methods = ['POST', 'GET']) 
def user_profile(username):
	if request.method == 'POST':
		username=session['username']
		file = request.files['file']
		file.save(os.path.join(app.config['UPLOAD_FOLDER'], session['username']))
		session['avatar_updated'] = 'avatar updated!'
		return redirect(url_for('user_profile',username=username))
	user_profile = db_functions.user_profile_get(username)
	if 'avatar_updated' in session:
		avatar_updated = session['avatar_updated']
		session.pop('avatar_updated',None)
		return render_template("user_profile.html",user_profile=user_profile,avatar_updated=avatar_updated)
	return render_template("user_profile.html",user_profile=user_profile)

@app.route("/",methods=['GET','POST'])
def index():
	if 'message' in session:
		message = session['message']
		session.pop('message', None)
		if 'username' in session:
			social_header,summary,next_task = home_dashboard(session['hometown'],session['username'])
			session['weather_summary'] = summary
			return render_template("index.html",message=message,social_header=social_header,summary=summary,next_task=next_task)
		else:
			session.clear()
			return render_template("index.html",message=message)
	elif 'username' in session:
		message = session.get('message',None)
		session.pop('message',None)
		diff_weather_log = session['log_time'] - datetime.strptime(session['weather_summary']['forecast_time'],'%Y-%m-%d %H:%M')
		diff_weather_log = ((diff_weather_log.seconds//60))
		print('difference between log time and forecast summary is %s'%diff_weather_log)
		if diff_weather_log < 120:
			social_header = db_functions.home_crud_first()
			next_task = db_functions.calendar_dashboard(session['username'])
			summary = session['weather_summary']
			session['log_time'] = datetime.now()
			return render_template("index.html",social_header=social_header,summary=summary,next_task=next_task,message=message)
		elif diff_weather_log > 120:
			social_header,summary,next_task = home_dashboard(session['hometown'],session['username'])
			session['log_time'] = datetime.now()
			session['weather_summary'] = summary
			return render_template("index.html",social_header=social_header,summary=summary,next_task=next_task,message=message)
		else:
			social_header,summary,next_task = home_dashboard(session['hometown'],session['username'])
			session['weather_summary'] = summary
			return render_template("index.html",social_header=social_header,summary=summary,next_task=next_task,message=message)
	else:
		return render_template("index.html")
		
		

	
@app.route('/year_validation/', methods=['POST'])
def year_validation():
	years = ["2019","2020","2021"]
	employer = request.form['search_parameter']
	paydate_month_offset = db_functions.tax_contract_get(session['username'],employer)[0][0]
	if 'contract' in request.form:
		return jsonify({'fail':'no employer'})
	check_inserted = [len(db_functions.tax_check_inserted_data_v2(str(pd.to_datetime(year)),session['username'],employer,paydate_month_offset)) for year in years]
	year_dict = [{"year":year ,"inserted":check} for year,check in zip(years,check_inserted)]
	year_dict = json.dumps(year_dict)
	return year_dict
	
	
@app.route('/contract_validation', methods=['POST'])
def contract_validation():
	employer = request.form['employer']
	existing_contracts = db_functions.tax_contract_get(session['username'])
	if employer in [i[2] for i in existing_contracts]:
		return jsonify({'error':'existing contract for {} found'.format(employer)})
	return jsonify({'success':'can create contract'})
	

@app.route('/contract_changes', methods=['POST'])
def contract_changes():
	try:
		json_change = request.get_json()
		if json_change['edit_contract']:
			cancel_filters = [contract['contract_id'] for contract in json_change['edit_contract'] if contract['command'] == 'delete' ]
			for name in json_change:
				if name == 'edit_contract':
					continue
				json_change[name]  = [i for i in json_change[name] if int(i['contract_id']) not in cancel_filters]
			real_edits = ([contract for contract in json_change['edit_contract'] if contract['command'] != 'delete' and contract['contract_id'] not in cancel_filters])
			contract_id = [i['contract_id'] for i in real_edits]
			targets = [i['target'] for i in real_edits]
			values = [i['value'] for i in real_edits]
			edit_contract_table = pd.DataFrame(data={'contract_id':contract_id,'targets':targets,'values':values})
			db_functions.tax_contract_edit(edit_contract_table)
			db_functions.tax_contract_delete(cancel_filters)
		if json_change['add_rule']:
			rule_name = [ i['name'] for i in json_change['add_rule']]
			rate = [ i['rate'] for i in json_change['add_rule']]
			start_time = [ i['start'] for i in json_change['add_rule']]
			end_time = [ i['end'] for i in json_change['add_rule']]
			days_arr = mysql_to_python_days(json_change,'add_rule')
			contract_id = [ i['contract_id'] for i in json_change['add_rule']]
			supplement_table = pd.DataFrame(data={'rule_name':rule_name,'rate':rate,'start_time':start_time,'end_time':end_time,'days_arr':days_arr,'contract_id':contract_id})
			db_functions.tax_supplement_create(supplement_table)
		if json_change['delete_rule']:
			contract_id =  [i['contract_id'] for i in json_change['delete_rule']]
			rule_id = [ i['rule_id'] for i in json_change['delete_rule']]
			delete_supplement_table = pd.DataFrame(data={'contract_id':contract_id,'rule_id':rule_id})
			db_functions.tax_supplement_delete(delete_supplement_table)
		if json_change['edit_rule']:
			rule_id = [ i['rule_id'] for i in json_change['edit_rule']]
			rule_name = [ i['name'] for i in json_change['edit_rule']]
			rate = [ i['rate'] for i in json_change['edit_rule']]
			start_time = [ i['start'] for i in json_change['edit_rule']]
			end_time = [ i['end'] for i in json_change['edit_rule']]
			days_arr = mysql_to_python_days(json_change,'edit_rule')
			edit_supplement_table = pd.DataFrame(data={'rule_id':rule_id,'rule_name':rule_name,'rate':rate,'start_time':start_time,'end_time':end_time,'days_arr':days_arr})
			db_functions.tax_supplement_edit(edit_supplement_table)
		data = {"message":"success"}
		return data
	except Exception as e:
		print(e)
		data = {"message":"failure"}
		return data 

@app.route("/tax-year/",methods=['POST','GET'])
def tax_year():
	if request.method == 'POST':
		#if the post request is to deposit a year
		if 'search_parameter' in request.form:
			query = request.form['search_parameter']
			year = pd.to_datetime(request.form['year'])
			#offset the select dates, by the year which the payments fall into, not the actual work month
			paydate_month_offset = db_functions.tax_contract_get(session['username'],query)[0][0]
			start = (year - relativedelta(months=paydate_month_offset))
			end = (start + relativedelta(years=1))
			google_frame = main(start.isoformat()+'Z',end.isoformat()+'Z',query)
			google_frame['username'] = session['username']
			google_frame = google_frame.sort_index()
			google_frame = google_frame[(google_frame.index < pd.to_datetime(datetime.now().strftime('%Y-%m')))]
			google_frame = google_frame.reset_index(drop=True).drop(columns=['cal_id'])
			db_functions.deposit_google_tasks(google_frame[['start_time','end_time','username','category','title']])
			session['message'] = 'year {} added for {}!'.format(year.strftime('%Y'),query)
			return redirect(url_for("tax_year"))
		#if post request is not to deposit a year, it is creating new contract!
		#1. first, send basic info to db, fetch contract id
		employer = request.form['employer']
		paydate_month_offset = request.form['paydate_month_offset']
		base = request.form['base']
		contract_id = db_functions.tax_contract_create(session['username'],employer,paydate_month_offset,base)
		#2. optional supplement table, send to db with newly created contract id
		supplement_table = pd.DataFrame(data={'rule_name':request.form.getlist("rule_name"),'rate':request.form.getlist("rate"),'start_time':request.form.getlist("start_times"),'end_time':request.form.getlist("end_times"),'days_arr':request.form.getlist("days_arr")})
		if not supplement_table.empty:
			supplement_table['contract_id'] = contract_id
			db_functions.tax_supplement_create(supplement_table)
		#3. send to db if parse years requested (exists in form as array)
		parse_years = [int(year) for year in request.form.getlist("parse_years")]
		if parse_years:
			start = [datetime(year, 1, 1) - relativedelta(months=int(paydate_month_offset)) for year in parse_years]
			end =  [datetime(datetime.today().year,datetime.today().month,1) if start_year + relativedelta(years=1) >= datetime.today() else start_year + relativedelta(years=1) for start_year in start]
			parse_arr = [{'start':i.isoformat()+'Z','end':s.isoformat()+'Z'} for i,s in zip(start,end)]
			google_get = pd.concat(main(indexer['start'],indexer['end'],query=employer) for indexer in parse_arr)
			google_get['username'] = session['username']
			google_get = google_get.sort_index().reset_index(drop=True).drop(columns=['cal_id'])
			db_functions.deposit_google_tasks(google_get[['start_time','end_time','username','category','title']])
		#4. finally, redirect to page where everything can be viewed
		session['message'] = '{} added'.format(employer)
		return redirect(url_for("tax_year"))
	contracts = db_functions.tax_contract_get(session['username'])
	times = np.arange(0,25)
	if contracts: 
		contracts = [{'employer':i[2],'paydate_month_offset':i[3],'base':i[4],'contract_id':i[0]} for i in contracts]
		years = [2019,2020,2021]
		tax_years_frame,spline,perc = tax_year_header(session['username'],years,contracts)
		for indexer,dic in enumerate(contracts):
			contracts[indexer]['supplements']  = db_functions.tax_supplement_get(dic['contract_id'])
		message = session.get('message',None)
		session.pop('message',None)
		return render_template("tax_year.html",tax_years_frame=tax_years_frame,contracts=contracts,times=times,spline=spline,message=message,perc=perc)
	return render_template("tax_year.html",times=times)


@app.route('/delete_task', methods=['POST'])
def delete_task():
	print(request.form)
	try:
		cal_id = request.form['cal_id']
		category = request.form['category']
		if category == 'work':
			delete_event(cal_id)
		elif category != 'work':
			db_functions.calendar_delete_task(int(cal_id))
		data = {'response':'successfully deleted'}
	except Exception as e:
		print(e)
		data = {'response':'nothing deleted'}
	return data

@app.route('/create_task', methods=['POST'])
def create_task():
	try:
		if 'whole_day' in request.form:
			category = request.form['category']
			day = request.form['day']
			start_time = datetime.strptime(day,'%Y-%m-%d')
			end_time = start_time + timedelta(hours = 24)
			if category == 'work':
				employer = request.form['employer']
				create_event(employer,session['hometown'],start_time.strftime('%Y-%m-%d'),end_time.strftime('%Y-%m-%d'),all_day=True)
			elif category != 'work':
				username = session['username']
				title = request.form['title']
				db_functions.create_new_task(start_time,end_time,username,category,title)
		elif 'start_time' and 'end_time' in request.form:
			category = request.form['category']
			start_time = request.form['start_time']
			end_time = request.form['end_time']
			if category == 'work':
				employer = request.form['employer']
				create_event(employer,session['hometown'],start_time,end_time,all_day=False)
			elif category != 'work':
				username = session['username']
				title = request.form['title']
				db_functions.create_new_task(start_time,end_time,username,category,title)
		data = {'response':'task successfully created'}
		return data
	except Exception as e:
		print(e)
		data = {'response':'nothing created'}
	return data


@app.route('/edit_task', methods=['POST'])
def edit_task():
	try:
		category = request.form['category']
		if 'whole_day' in request.form:
			start_time = pd.to_datetime(request.form['day'])
			end_time = start_time + pd.Timedelta(days=1)
		else:
			start_time = request.form['start_time']
			end_time = request.form['end_time']
		if category == 'work':
			employer = request.form['employer']
		else:
			title = request.form['title']
		if 'delete_last' in request.form:
			delete_id = request.form['delete_last']
			delete_category = request.form['delete_target']
			if delete_category == 'work':
				delete_event(delete_id)
				db_functions.create_new_task(start_time,end_time,session['username'],category,title)
			elif delete_category != 'work':
				db_functions.calendar_delete_task(delete_id)
				create_event(employer,session['hometown'],start_time,end_time,all_day=False)
		if 'update_same' in request.form:
			cal_id = request.form['update_same']
			if category == 'work':
				edit_event(cal_id,employer,session['hometown'],start_time,end_time)
			elif category != 'work':
				
				db_functions.calendar_update_task(cal_id,category,title,start_time,end_time)
		data = {'success':'successfully edited'}
	except Exception as e:
		print(e)
		data = {'error':'nothing edited'}
	return data


@app.route("/calendar/<date>",methods = ['POST', 'GET'])
def home_calendar(date):
	date = datetime.strptime(date,'%Y-%m')
	if 'username' in session:
		state = 'enabled'
		title,framer = make_calendar(date,session['username'],session['role'])
		next_month = date + relativedelta(months=1)
		prev_month =  date - relativedelta(months=1)
		message = session.get('message',None)
		session.pop('message',None)
		db_employers = db_functions.tax_contract_get(session['username'])
		employers = [i[2] for i in db_employers]
		print(framer.iloc[1]['Wednesday'])
		return render_template("calendar.html",framer=framer,title=title,next_month=next_month,prev_month=prev_month,state=state,message=message,employers=employers,times=list(np.arange(0,25)))	
	title,framer = make_calendar(date)
	next_month = date + relativedelta(months=1)
	prev_month =  date - relativedelta(months=1)
	return render_template("calendar.html",framer=framer,title=title,next_month=next_month,prev_month=prev_month,state='disabled')

@app.route('/logout/')
def logout():
	message = 'username {} was succesfully logged out!'.format(session['username'])
	session['message'] = message
	session.pop('username', None)
	return redirect(url_for('index'))


@app.context_processor
def crud_component():
	crud_read = db_functions.crud_header()
	return {'crud_read':crud_read}
	

@app.route('/weather/',methods = ['POST', 'GET']) 
def enter_city(): 
	if request.method == 'POST':
		city = request.form['city']
		return redirect(url_for('weather_city', city = city))
	elif request.method == 'GET':
		return render_template("weather.html")

@app.route('/weather/<city>',methods = ['POST', 'GET']) 
def weather_city(city):
	try:
		table,summary,server_city,maxt,mint,dates,rain = get_weather(city)
		location = geolocator.geocode(server_city)
		geo_location = {'latitude':location.latitude,'longitude':location.longitude}
		return render_template("weather_city.html", table=table,summary=summary,server_city=server_city,maxt=maxt,mint=mint,dates=dates,city=city,geo_location=geo_location,rain=rain)	
	except:
		message = 'forecast not found for {}.'.format(city)
		return render_template("weather_city.html",message = message)

@app.route('/weather_translate_coord', methods=['POST'])
def weather_translate_coord():
	try:
		coords = request.form['coords']
		location = geolocator.reverse(coords)
		if 'city' in location.raw['address']:
			final_loc = location.raw['address']['city']
		if 'town' in location.raw['address']:
			final_loc = location.raw['address']['town']
		data = {"success":final_loc}
		return data
	except:
		data = {"error":"look up failed"}
		return data 


@app.context_processor
def inject_now():
	return {'now': datetime.now()}
	
@app.template_filter()
def render_ago(stamp):
	time_string = ago(stamp)
	return time_string

@app.template_filter()
def thousandsFormat(value):
	value = int(value)
	return "{:,}".format(value)
    
@app.errorhandler(404)
def page_not_found(e):
	error = e
	return render_template('404.html',error=error), 404

'''forum prototyping'''


@app.route('/forum_validation', methods=['POST'])
def forum_validation():
	query = request.form['query']
	data = db_functions.search_forums(query)
	if not data:
		return jsonify({'error':'umm yeah nothing'})
	return jsonify({'success':'looks good'})
	

@app.route('/thread_edit_ajax', methods=['POST'])
def thread_edit_ajax():
	thread_id = request.form['thread_id']
	edited_title = request.form['edited_title']
	edited_post = request.form['edited_post']
	db_functions.crud_update(thread_id,edited_title,edited_post)
	return jsonify({'success':'done'})

@app.route("/forum/<int:page>/",methods=['GET','POST'])
@app.route("/forum/sort_by=<sort_key>&ascending=<ascending>/<int:page>/",methods=['GET','POST'])
def forum(page,sort_key=None,ascending=None):
	crud_read = db_functions.crud_header()
	pages = math.ceil(len(crud_read) / 5)
	pagination = np.arange(0,pages) + 1
	if 'query' in request.form:
		query = request.form['query']
		return redirect(url_for('forum_results',query=query,page=1))
	elif 'post' in request.form:
		title = request.form['title']
		post = request.form['post']
		username = session['username']
		db_functions.crud_insert(title,post,username)
		session['post_added'] = 'post added!'
		return redirect(url_for('forum',page=1))
	elif 'thread_id' in request.form:
		thread_id = request.form['thread_id']
		db_functions.crud_delete(thread_id)
		if len(get_page(page,crud_read)) == 1:
			page = page - 1
		session['post_deleted'] = 'post deleted!'
		return redirect(url_for('forum',page=page,sort_key=sort_key,ascending=ascending))
	elif 'title' in request.form:
		if request.form['last']  == 'title':
			ascending = not json.loads(ascending.lower())
			return redirect(url_for('forum',page=page,sort_key='title',ascending=ascending))
		ascending= True
		return redirect(url_for('forum',page=page,sort_key='title',ascending=ascending))
	elif 'username' in request.form:
		if request.form['last']  == 'username':
			ascending = not json.loads(ascending.lower())
			return redirect(url_for('forum',page=page,sort_key='username',ascending=ascending))
		return redirect(url_for('forum',page=page,sort_key='username',ascending=True))
	elif 'stamp' in request.form:
		if request.form['last']  == 'stamp':
			ascending = not json.loads(ascending.lower())
			return redirect(url_for('forum',page=page,sort_key='stamp',ascending=ascending))
		return redirect(url_for('forum',page=page,sort_key='stamp',ascending=True))
	elif sort_key and ascending:
		new_table = get_page(page,crud_read,sort_key,ascending)
		if 'post_deleted' in session:
			post_removed = session['post_deleted']
			session.pop('post_deleted',None)
			return render_template('forum.html',new_table=new_table,pagination=pagination,current_page=page,last=sort_key,sort_key=sort_key,ascending=ascending,post_removed=post_removed)
		return render_template('forum.html',new_table=new_table,pagination=pagination,current_page=page,last=sort_key,sort_key=sort_key,ascending=ascending)
	new_table = get_page(page,crud_read)
	if 'post_added' in session:
		post_success = session['post_added']
		session.pop('post_added',None)
		return render_template('forum.html',new_table=new_table,pagination=pagination,current_page=page,post_success=post_success)
	elif 'post_deleted' in session:
		post_removed = session['post_deleted']
		session.pop('post_deleted',None)
		return render_template('forum.html',new_table=new_table,pagination=pagination,current_page=page,post_removed=post_removed)
	return render_template('forum.html',new_table=new_table,pagination=pagination,current_page=page)
	
	
@app.route("/forum/query=<query>/<int:page>/",methods=['GET','POST'])
@app.route("/forum/query=<query>&sort_by=<sort_key>&ascending=<ascending>/<int:page>/",methods=['GET','POST'])
def forum_results(query,page,sort_key=None,ascending=None):
	crud_read = db_functions.search_forums(query)
	pages = math.ceil(len(crud_read) / 5)
	pagination = np.arange(0,pages) + 1
	if 'query' in request.form:
		query = request.form['query']
		return redirect(url_for('forum_results',query=query,page=1))
	elif 'post' in request.form:
		title = request.form['title']
		post = request.form['post']
		username = session['username']
		db_functions.crud_insert(title,post,username)
		session['post_added'] = 'post added!'
		return redirect(url_for('forum',page=1))
	elif 'thread_id' in request.form:
		thread_id = request.form['thread_id']
		db_functions.crud_delete(thread_id)
		if len(get_page(page,crud_read)) == 1:
			page = page - 1
		session['post_deleted'] = 'post deleted!'
		return redirect(url_for('forum_results',query=query,page=page,sort_key=sort_key,ascending=ascending))
	elif 'title' in request.form:
		if request.form['last']  == 'title':
			ascending = not json.loads(ascending.lower())
			return redirect(url_for('forum_results',query=query,page=page,sort_key='title',ascending=ascending))
		ascending= True
		return redirect(url_for('forum_results',query=query,page=page,sort_key='title',ascending=ascending))
	elif 'username' in request.form:
		if request.form['last']  == 'username':
			ascending = not json.loads(ascending.lower())
			return redirect(url_for('forum_results',query=query,page=page,sort_key='username',ascending=ascending))
		ascending= True
		return redirect(url_for('forum_results',query=query,page=page,sort_key='username',ascending=ascending))
	elif 'stamp' in request.form:
		if request.form['last']  == 'stamp':
			ascending = not json.loads(ascending.lower())
			return redirect(url_for('forum_results',query=query,page=page,sort_key='stamp',ascending=ascending))
		ascending= True
		return redirect(url_for('forum_results',query=query,page=page,sort_key='stamp',ascending=ascending))
	elif sort_key and ascending:
		new_table = get_page(page,crud_read,sort_key,ascending)
		if 'post_deleted' in session:
			post_removed = session['post_deleted']
			session.pop('post_deleted',None)
			return render_template('forum_results.html',new_table=new_table,pagination=pagination,current_page=page,last=sort_key,sort_key=sort_key,ascending=ascending,query=query,post_removed=post_removed)
		return render_template('forum_results.html',new_table=new_table,pagination=pagination,current_page=page,last=sort_key,sort_key=sort_key,ascending=ascending,query=query)
	new_table = get_page(page,crud_read)
	if 'post_deleted' in session:
		post_removed = session['post_deleted']
		session.pop('post_deleted',None)
		return render_template('forum_results.html',new_table=new_table,pagination=pagination,current_page=page,query=query,post_removed=post_removed) 
	return render_template('forum_results.html',new_table=new_table,pagination=pagination,current_page=page,query=query)
	
@app.route('/forum/thread/<int:thread>/',methods=['POST','GET'])
def forum_thread(thread):
	if request.method == 'POST':
		if 'reply' in request.form: 
				if any(request.form['reply']):
					thread_id, reply,username = request.form['thread_id'], request.form['username'],request.form['reply']
					db_functions.thread_reply(thread_id,reply,username)
					thread,replies,reply_reply = thread_page(thread)
					return render_template('thread.html',thread=thread,replies=replies,reply_reply= reply_reply)
				else:
					thread,replies,reply_reply = thread_page(thread)
					error_message='please fill in the reply!'
					return render_template('thread.html',thread=thread,replies=replies,reply_reply= reply_reply,error_message=error_message)
		elif 'reply_to_replier' in request.form:
			input_reply = request.form['reply_to_replier']
			input_username = request.form['session_to_replier']
			input_reply_id = request.form['reply_to_reply_id']
			db_functions.reply_reply(input_reply_id,input_username,input_reply)
			thread,replies,reply_reply =thread_page(thread)
			return render_template('thread.html',thread=thread,replies=replies,reply_reply= reply_reply)
		
	thread,replies,reply_reply = thread_page(thread)
	return render_template('thread.html',thread=thread,replies=replies,reply_reply=reply_reply)
	
'''testing highcharts here'''



if (__name__ == "__main__"):
	app.run(port = 5000, debug=True)
