# -*- coding: utf-8 -*-
import json
import pandas as pd
import requests
import numpy as np
import re
import pymysql
import pycountry_convert as pc
import db_functions
import calendar
from google_get import main
con = pymysql.connect('localhost', 'root', 'Karelia', 'geo_data')
from datetime import datetime,date,timedelta
from dateutil.relativedelta import relativedelta
from pandas.tseries.offsets import DateOffset
import pytz
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder
geolocator = Nominatim(user_agent="google_calendar_create")


def get_time_zone(hometown):
	location = geolocator.geocode(hometown)
	obj = TimezoneFinder()
	time_zone = obj.timezone_at(lng=location.longitude, lat=location.latitude)
	return time_zone


def mysql_to_python_days(json_change,rule_name):
	days_arr_filter = []
	for i in json_change[rule_name]:
		day_string = [str(day) for day in i['days']]
		fixed_string = "["+",".join(day_string)+"]"
		days_arr_filter.append(fixed_string)
	return days_arr_filter

def tax_year_header(username,years,contracts):
	#select values from db based on values in contracts, into one frame
	tax_years = pd.concat(db_functions.tax_years_get_v2(username,employer['employer']) for employer in contracts)
	
	#same but for google calendar
	tax_years_append = main(username,pd.to_datetime(datetime.today().strftime('%Y-%m')).isoformat() + 'Z')
	
	#merge google and db values
	tax_years = tax_years.append(tax_years_append[['start_time','end_time','title']])
	tax_years.index.name = 'dates'
	
	#aggregate hours diff, working days where exists and the contract month offset 
	tax_years['total hours'] = tax_years['end_time'] - tax_years['start_time']
	tax_years['total hours'] = tax_years['total hours'].dt.total_seconds() / 3600
	
	tax_years['work days'] = 1
	for i in contracts:
		tax_years.loc[tax_years.title.str.contains(i['employer']),'offset'] = i['paydate_month_offset']
		tax_years.loc[tax_years.title.str.contains(i['employer']),'estimate'] = i['base'] * tax_years.loc[tax_years.title.str.contains(i['employer'])]['total hours']
		
	#supplement handling. supplement comes in a list of dictionaries
	supplement_rules = db_functions.tax_rules_get(username)
	if supplement_rules:
		for i in supplement_rules:
			col_string =  '{} - {} (€{})'.format(i['employer'], i['rule_name'],str(i['rate']))
			tax_years.loc[(tax_years.title.str.contains(i['employer']))&(tax_years.index.weekday.isin(i['target_days'])),col_string] = [sum(np.in1d(pd.date_range(val[0],val[1],freq='H')[:-1].hour,np.arange(i['start_time'],i['end_time'],dtype=int))) for val in tax_years.loc[(tax_years.title.str.contains(i['employer']))& (tax_years.index.weekday.isin(i['target_days']))][['start_time','end_time']].values]
			tax_years = tax_years.fillna(0)
			tax_years['estimate'] = tax_years['estimate'] + tax_years[col_string].values * i['rate']
		
		#exclude rule columns, make a non supplement column which is those minus total
		rule_filter = ['{} - {} (€{})'.format(i['employer'], i['rule_name'],str(i['rate'])) for i in supplement_rules]
		rule_filter.append('work days')
		tax_years['non supplement'] = (tax_years['total hours']  -  tax_years[rule_filter].sum(axis=1)).clip(0)

	google_title_filter = []
	
	for title in tax_years.title:
		for contract in contracts:
			if contract['employer'].lower() in title.lower():
				fixed = '{} - (€{})'.format(contract['employer'],contract['base'])
				break
			else:
				fixed = 'error'
		google_title_filter.append(fixed)
	
	tax_years['employer'] = google_title_filter
	tax_years = tax_years.reset_index()
	tax_years = tax_years.join(pd.pivot_table(tax_years,index=tax_years.index,columns='employer',values='total hours').fillna(0)).drop(columns='employer')
	
	
	
	#resetting order of columns
	aggregates = [columns for columns in tax_years.columns for contract in contracts if contract['employer'] in columns]
	aggregates.sort()
	rest = [i for i in tax_years.columns if i not in aggregates]
	tax_years = tax_years[aggregates].join(tax_years[rest])
	
	#convert index to period, then a new column which is index offset by contract pay month differential
	tax_years['post_to'] = tax_years['dates'].dt.to_period('M') + tax_years.offset.astype(int)
	tax_years = tax_years.drop(columns=['offset','start_time','end_time','title','dates'])
	
	#get unique values for post years, to generate html classes for the html page
	year_slicer = np.sort(tax_years.post_to.dt.year.unique())
	year_slicer.sort()
	
	#optional: making higcharts spline value here
	avg = tax_years.groupby(tax_years.post_to).sum()
	avg = avg.groupby(avg.index.month).mean().round(2)
	spline = {'name': 'mean','data': [{'x':i[0]-1,'y':i[1]} for i in zip(avg.index,avg.estimate.values)],'type': 'spline'}
	
	#optional: can only do this after post_to is added to the table,create graph of 
	if supplement_rules:
		perc = (tax_years[rule_filter + list(['post_to','non supplement'])].drop(columns=['work days']).groupby(tax_years.post_to).sum() / tax_years[['total hours','post_to']].groupby(tax_years.post_to).sum().values * 100).round(2)
		perc_series = [{'name':column,'data':list(perc[arr].values)} for column,arr in zip(perc.columns,perc)]
		categories = [str(i) for i in perc.index]
		perc = {'series':perc_series,'xAxis':{'categories':categories}}

	else:
		perc = None
	
	#create an array of frames, seperated by post year (tax year), then group the sums together
	stuff = [tax_years[tax_years.post_to.dt.year == year] for year in years if not tax_years[tax_years.post_to.dt.year == year].empty]
	stuff = [stuff[i].groupby(stuff[i].post_to).sum().round(2) for i in range(0,len(stuff))]
	
	#any number which is a result of a rule, is parsed as integer since the hour checking is in hour increments
	for s,i in enumerate(stuff):
		#i.index = i.index.to_timestamp().month_name()
		i.loc['total'] = i.sum()
		i.index.name = 'post_to'
		if supplement_rules:
			i[rule_filter] = i[rule_filter].astype(int)
		i['estimate'] = i['estimate'].apply(lambda x: "€{:,.2f}".format(x))
		i[i.eq(0)] = np.nan
		#print(i.fillna(''))
		fix_columns = list(i.columns)
		fix_columns.remove('estimate')
		fix_columns.append('estimate')
		stuff[s] = i[fix_columns]
	
	styler = '<table class="dataframe table" id ={} border=1>'
	
	tax_years_frame = [frame.reset_index().fillna('').to_html(classes='table',table_id=year, header=True,index=False) for year,frame in zip(year_slicer,stuff)]
	tax_years_frame.reverse()
	
	return tax_years_frame,spline,perc

def get_page(page,crud_table,sort_key=None,direction=None,last=None):
	crud_table = pd.DataFrame(crud_table)
	crud_table.columns = ['id','title','post','stamp','when_was','username'] 
	if sort_key and direction:
		direction = json.loads(direction.lower())
		crud_table = crud_table.sort_values(by=[sort_key],ascending=direction)
		crud_table = crud_table.reset_index(drop=True)
	rows = 5
	max_page = rows * page
	indexer = np.arange(max_page - 5,max_page)
	new_table = crud_table.loc[indexer[0]:indexer[-1]]
	return new_table

def ago(time):
	num_months = (datetime.now().year - time.year) * 12 + (datetime.now().month - time.month)
	if num_months <1:
		difference = datetime.now() - time
		if difference.days == 0:
			hours = int(difference.seconds / 3600)
			if hours > 1:
				time_string = '{} hours ago'.format(hours)
				return time_string
			elif hours == 1:
				time_string = '{} hour ago'.format(hours)
				return time_string
			elif hours == 0:
				minutes = ((difference.seconds//60)%60)
				if minutes > 0:
					time_string = '{} minutes ago'.format(((difference.seconds//60)%60) )
					return time_string
				else:
					time_string = 'now'
					return time_string
		elif difference.days > 1:
			time_string = '{} days ago'.format(difference.days)
			return time_string
		else:
			time_string = 'yesterday'
			return time_string
	elif num_months > 11:
		years = datetime.now().year - time.year
		if years == 1:
			time_string = 'last year'
			return time_string
			time_string = '{} years ago'.format(years)
			return time_string
	elif num_months > 1:
		time_string = '{} months ago'.format(num_months)
		return time_string
	elif num_months == 1:
		time_string = 'last month'
		return time_string
	return time

def thread_page(thread):
	thread=db_functions.thread_main(thread)
	replies = db_functions.crud_thread_read(thread['id'])
	reply_reply =db_functions.crud_reply_read(thread['id'])
	return thread,replies,reply_reply

def home_dashboard(hometown,username):
	social_header = db_functions.home_crud_first()
	next_task = db_functions.calendar_dashboard(username)
	url = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/forecast?aggregateHours=24&combinationMethod=aggregate&contentType=json&unitGroup=metric&locationMode=single&key=NFL5M6IWKEWK1CTBV54KLQ9JR&dataElements=default&locations={}'.format(hometown)
	response = requests.get(url)
	data = response.json()
	home_town = data['location']['id']
	weather_summary =  data['location']['currentConditions']['icon']
	forecast_time = data['location']['currentConditions']['datetime'][:10] + ' '+ data['location']['currentConditions']['datetime'][11:16]
	windchill = data['location']['currentConditions']['windchill']
	temperature = data['location']['currentConditions']['temp']
	
	summary = {'home_town': home_town,'summary':weather_summary,'forecast_time':forecast_time,'wind_chill':windchill,'temperature':temperature}
	
	return social_header,summary,next_task

def make_day(date,username=None,role=None):
	cal_data = db_functions.check_day_tasks(date,username)
	check_future = (int(pd.to_datetime(date).strftime('%Y%m')) - int(datetime.now().strftime('%Y%m')))
	#admin_roles = db_functions.check_roles(username)
	if check_future >= 0 and role == 'admin':
		day = pd.to_datetime(date).strftime('%Y-%m-%d')
		times = [pd.to_datetime(day) + timedelta(hours = int(i)) for i in np.arange(0,24)]
		start = times[0].isoformat() + 'Z'
		end = times[-1].isoformat() + 'Z'
		google_get = main(username,start,end)
		cal_data = cal_data.append(google_get)
		cal_data = cal_data[(cal_data.index == day)]
		return cal_data
	return cal_data
	
def make_calendar(date,username=None,role=None):
	stamp = pd.to_datetime(date)
	#list of dates relative to current month
	stamp_ranger = pd.date_range(start='{}/1/{}'.format(stamp.month,stamp.year), end='{}/{}/{}'.format(stamp.month,stamp.days_in_month,stamp.year))
	stamp_min = stamp_ranger[0] - timedelta(days=stamp_ranger[0].dayofweek)
	stamp_max = stamp_ranger[-1] + timedelta(days=abs(stamp_ranger[-1].dayofweek - 6))
	#list of dates relative to all week numbers in the current month
	calender_list = pd.date_range(stamp_min,stamp_max)
	weeks = pd.Series(calender_list.isocalendar().week.unique())
	#we always want the calendar items which were saved by the user, its sliced according to first and last day of week numbers
	cal_data = db_functions.check_calendar_v2(str(calender_list[0]),str(calender_list[-1]+timedelta(days=2)),username)
	
	#only admin has access to google calendar api!
	if role == 'admin':
		start = calender_list[0].isoformat() + 'Z'
		end = (calender_list[-1] + timedelta(days=1)).isoformat() + 'Z'
		#check if work tasks exists for this month
		stuff = db_functions.check_calendar_exists(str(stamp))
		if stuff[0] == True:
			#server difference is the diff of target month dates, and week number dates, offset by future values
			server_db_diff = list(set(calender_list) - set(stamp_ranger))
			server_db_diff.sort()
			server_db_diff =[i for i in server_db_diff if i.month == datetime.today().month]
			
			#if work tasks exist for the month, but there are future dates in the calendar
			if any(server_db_diff):
				print('server not hit for target month but future dates requested')
				start = server_db_diff[0].isoformat() + 'Z'
				end = server_db_diff[-1].isoformat() + 'Z'
				google_get = main(username,start,end)
				google_get['category'] = 'work'
				cal_data = cal_data.append(google_get)
				cal_data = cal_data.drop_duplicates(subset=['start_time'])
				pass
			#work tasks exist for this month, but no dates past target month exist in calendar
			else:
				print('server not hit')
				pass
		else:
			check_past_month = (int(stamp.strftime('%Y%m')) - int(datetime.now().strftime('%Y%m')))
			#if number is negative, meaning that the month is previous to the current:
			if check_past_month <0:
				google_get = main(username,start,end) 
				google_frame = google_get.sort_index()
				google_frame = google_frame.reset_index(drop=True)
				google_frame = google_frame.drop(columns=['cal_id'])
				google_frame['username'] = username
				google_frame = google_frame[['start_time','end_time','username','category','title']]
				#only insert the target month, since values might exist for previous month (dont want duplicates)
				mysql_target = google_frame[(google_frame['start_time'].dt.year == stamp.year) & (google_frame['start_time'].dt.month == stamp.month)]
				db_functions.deposit_google_tasks(mysql_target)
				cal_data = cal_data.append(google_get)
				cal_data = cal_data.drop_duplicates(subset=['start_time'])
				print('server hit and values for {} inserted to database'.format(stamp.strftime('%Y-%m')))
			else:
				google_get = main(username,start,end)
				google_get['category'] = 'work'
				cal_data = cal_data.append(google_get)
				cal_data = cal_data.drop_duplicates(subset=['start_time'])
				print('server hit')
	
	#we need to check for any values which extend over midnight, and pass those to the calendar!
	selected_arr = []
	
	#cycle through rows
	for i in cal_data.iterrows():
		cal_id = i[1]['cal_id']
		title = i[1]['title']
		category = i[1]['category']
		range_of = pd.date_range(i[1]['start_time'],i[1]['end_time'],freq='H')
		days =  pd.to_datetime(pd.date_range(i[1]['start_time'],i[1]['end_time'],freq='H').date)
		data={'cal_id':np.repeat(cal_id, len(range_of)),'title':np.repeat( title, len(range_of)),'category':np.repeat(category, len(range_of)),'times':range_of,'days':days}
		framer = pd.DataFrame(data=data,index=days)
		framer.index.name = 'db_date'

		#cycle through unique days in the times column, which filter column by that value
		for day in days.unique():
			selected = framer.loc[day].copy()
        
			#if series
			if isinstance(selected, pd.Series):
				selected = selected.to_frame().T
				selected['start_time'] = selected.times
				selected['end_time']  =  pd.to_datetime(selected.times + pd.Timedelta(hours=1))
				
				#if list exists
				if selected_arr:
					
					#if the last item in the list has the same id and ending time is not zero, offset it.
					#however, if the creating ending time for the selected frame of the offset day is higher than the original end time, don't add it
					if selected_arr[-1].cal_id.item() == selected['cal_id'].item():   
						if int(selected_arr[-1].end_time.item().hour) != 0:
							selected_arr[-1].end_time = selected_arr[-1].end_time + pd.Timedelta(hours=1)
							if selected['end_time'].item() > selected_arr[-1].end_time.item():
								print('this frame is not added')
							else:
								selected_arr.append(selected.drop(columns=['times']))
					else:
						selected_arr.append(selected.drop(columns=['times']))
				else:
					selected_arr.append(selected.drop(columns=['times']))
			
			#if dataframe
			else: 
				selected['start_time']  =  selected.iloc[0].times
				selected['end_time']  =  selected.iloc[-1].times
				selected = selected.iloc[0].to_frame().T
				
				#if list exists, check if id matches. if it does, and ending time is not zero, its part of the same event. offset the time
				if selected_arr:
					if selected_arr[-1].cal_id.item() == selected['cal_id'].item() and int(selected_arr[-1].end_time.item().hour) != 0:
						selected_arr[-1].end_time = selected_arr[-1].end_time + pd.Timedelta(hours=1)
				selected_arr.append(selected.drop(columns=['times']))
	
	#merge data together (from db tasks or google api stuff)
	if cal_data.empty == False:
		cal_data = pd.concat(selected_arr)
		cal_list = []
		cal_data = cal_data.sort_values('start_time')
		for date_string in calender_list:
			if date_string in cal_data.index:
				try:
					cal_dict = {}
					cal_dict['date'] = date_string
					cal_dict['data'] = {}
					if len(cal_data.loc[date_string]) > 1:  
						for cal_id in cal_data.loc[date_string]['cal_id'].values:
							cal_dict['data'][cal_id] = {'start_time': cal_data[cal_data['cal_id'] == cal_id].start_time[0],'end_time':cal_data[cal_data['cal_id'] == cal_id].end_time[0],'title':cal_data[cal_data['cal_id'] == cal_id].title[0],'category':cal_data[cal_data['cal_id'] == cal_id].category[0]}    
					cal_list.append(cal_dict)
				except:
					cal_dict = {}
					cal_dict['date'] = date_string
					cal_dict['data'] = {}
					cal_dict['data'][cal_data.loc[date_string]['cal_id']] = {'start_time':cal_data.loc[date_string]['start_time'],'end_time':cal_data.loc[date_string]['end_time'],'title':cal_data.loc[date_string]['title'],'category':cal_data.loc[date_string]['category']}
					
					cal_list.append(cal_dict)
			else:
				cal_list.append(date_string)
		
		framer = pd.DataFrame(np.array(cal_list).reshape(len(weeks),7),index = weeks)
		framer.index.name = 'week'
		framer.columns = [ calendar.day_name[i] for i in framer.columns]
		title = stamp.strftime('%B %Y')
		return title,framer.reset_index()
	
	#if there are no tasks as queried by the database, or this month in work stuff
	framer = pd.DataFrame(np.array(calender_list).reshape(len(weeks),7),index = weeks)
	framer.index.name = 'week'
	framer.columns = [ calendar.day_name[i] for i in framer.columns]
	title = stamp.strftime('%B %Y')
	
	return title,framer.reset_index()

def get_weather(city):
	#json requests
	url = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/forecast?aggregateHours=24&combinationMethod=aggregate&contentType=json&unitGroup=metric&locationMode=single&key=NFL5M6IWKEWK1CTBV54KLQ9JR&dataElements=default&locations={}'.format(city)
	response = requests.get(url)
	data = response.json()
	#print(str(data['remainingCost']) + ' server requests remaining today')
	server_city = data['location']['address']
	#create lists for forecast table
	maxt = [i['maxt'] for i in data['location']['values']]
	mint = [i['mint'] for i in data['location']['values']]
	visib = [i['visibility'] for i in data['location']['values']]
	wind = [i['wspd'] for i in data['location']['values']]
	dates = [i['datetimeStr'][0:10] for i in data['location']['values']]
	clouds = [i['cloudcover'] for i in data['location']['values']]
	rain = [i['precip'] for i in data['location']['values']]
	gust = [i['wgust'] for i in data['location']['values']]
	conditions = [i['conditions'] for i in data['location']['values']]
	humidity = [i['humidity'] for i in data['location']['values']]
	table = zip(dates,maxt,mint,rain,clouds,conditions,humidity,wind,gust,visib)
	
	
	
	#create summary table
	weather_summary =  data['location']['currentConditions']['icon']
	forecast_time = data['location']['currentConditions']['datetime'][:10] + ' '+ data['location']['currentConditions']['datetime'][11:16]
	windchill = data['location']['currentConditions']['windchill']
	temperature = data['location']['currentConditions']['temp']
	
	sunrise = data['location']['currentConditions']['sunrise'][11:16]
	sunset = data['location']['currentConditions']['sunset'][11:16]
	day_length = (datetime.strptime(sunset,'%H:%M') - datetime.strptime(sunrise,'%H:%M'))
	day_length_string = str(day_length)
	hours = int(day_length_string.split(':')[0])
	minutes = int(day_length_string.split(':')[1])
	
	summary = {'summary':weather_summary,'forecast_time':forecast_time,'wind_chill':windchill,'temperature':temperature,'sunrise':sunrise,'sunset':sunset,'hours':hours,'minutes':minutes}
	return table,summary,server_city,maxt,mint,dates,rain
	
