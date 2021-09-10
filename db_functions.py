import pymysql
import pandas as pd
import datetime
import json
from geopy.geocoders import Nominatim
geolocator = Nominatim(user_agent="flask_app_koji")

con = pymysql.connect('localhost', 'root', 'Karelia', 'geo_data')

'''repetive functions here'''

def connect():
	con.connect()
	db_connect = con.cursor()

	return db_connect

'''admin roles'''
def check_roles(username):
	select_main = connect()
	select_main.callproc('check_roles',(username,))
	is_exists = select_main.fetchone()
	con.commit()
	con.close()
	return is_exists

'''login functions'''

def check_user(email_username,password):
	select_main = connect()
	select_main.callproc('check_email_password',(email_username,password))
	rows = select_main.fetchone()
	print(rows)
	con.commit()
	con.close()
	return rows

def check_new_user(email,username):
	select_main = connect()
	select_main.callproc('check_new_user',(email,username,))
	rows = select_main.fetchall()
	con.commit()
	con.close()
	return rows

def create_new_user(username,email,home_town,password):
	insert_main = connect()
	try:
		location = geolocator.geocode(home_town)
		hometown = location.raw['display_name']
	except:
		hometown = 'unknown'
	insert_main.callproc('create_new_user',(username,email,hometown,password))
	con.commit()
	
	
def user_profile_get(username):
	try:
		select_main = connect()
		select_main.callproc('user_profile_get',(username,))
		rows = select_main.fetchone()
		user_profile = {'username':rows[0],'email':rows[1],'created':rows[2],'hometown':rows[3],'password':rows[4]}
		con.commit()
		return user_profile
	except:
		return None



'''blog functions'''

def crud_header():
	con.connect()
	select_main = con.cursor()
	select_main.execute('call crud_read()')
	crud_read = select_main.fetchall()
	con.commit()
	con.close()
	return crud_read

def crud_insert(category,post,username):
	con.connect()
	insert_main = con.cursor()
	insert_main.callproc('crud_create',(category,post,username))
	con.commit()
	con.close()
	success = 'done'
	return success

def crud_delete(delete_id):
	con.connect()
	delete_main = con.cursor()
	delete_main.callproc('crud_delete',(delete_id,))
	con.commit()
	con.close()


def crud_edit(edit_string):
	update_main = connect()
	update_main.callproc('crud_update_form',(edit_string,))
	rows = update_main.fetchall()
	con.commit()
	title = rows[0][0]
	post = rows[0][1]
	return title, post

def crud_update(edit_string,update_cat,update_post):
	update_main = connect()
	update_main.callproc('crud_update_db',(edit_string,update_cat,update_post,))
	con.commit()

'''tax years'''

def tax_contract_get(username,search_parameter=None):
	select_main = connect() 
	select_main.callproc('tax_contract_get',(username,search_parameter))
	rows = select_main.fetchall()
	con.commit()
	con.close()
	return rows
	
def tax_rules_get(username):
	select_main = connect() 
	select_main.callproc('tax_rules_get',(username,))
	rule_rows = select_main.fetchall()
	columns =  [i[0] for i in select_main.description]
	con.commit()
	con.close()
	rule_arr = [{column: (json.loads(val) if column == 'target_days' else val) for column,val in zip(columns,row)} for row in rule_rows]
	return rule_arr


def tax_check_inserted_data_v2(year,username,employer,paydate_month_offset):
	select_main = connect() 
	select_main.callproc('tax_check_inserted_data_v2',(year,username,employer,paydate_month_offset))
	rows = select_main.fetchall()
	con.commit()
	return rows
	


def tax_years_get_v2(username,employer):
	select_main = connect() 
	select_main.callproc('tax_years_get_v2',(username,employer))
	rows = select_main.fetchall()
	columns =  [i[0] for i in select_main.description]
	con.commit()
	con.close()
	framer = pd.DataFrame(rows,columns=columns)
	framer = framer.set_index('work_day',drop=True)
	framer.index = pd.to_datetime(framer.index)
	#framer['total_hours'] = (framer['end_time'] - framer['start_time']).dt.seconds / 3600
	return framer

def tax_contract_create(username,employer,paydate_month_offset,base):
	con.connect()
	insert_main = con.cursor()
	insert_main.callproc('tax_contract_create',(username,employer,paydate_month_offset,base))
	contract_id = insert_main.fetchone()[0]
	con.commit()
	con.close()
	return contract_id
	
	
def tax_contract_delete(cancel_filters):
	con.connect()
	delete_main = con.cursor()
	for contract in cancel_filters:
		delete_main.callproc('tax_contract_delete',(contract,))
	con.commit()
	con.close()

def tax_contract_edit(edit_contract_table):
	con.connect()
	update_main = con.cursor()
	for input_contract_id, input_target, input_value in edit_contract_table.values:
		update_main.callproc('tax_contract_edit',(input_contract_id, input_target, input_value))
	con.commit()
	con.close()
		
	
def tax_supplement_create(supplement_table):
	con.connect()
	insert_main = con.cursor()
	for rule_name,rate,start_time,end_time,target_days,contract_id in supplement_table.values:
		insert_main.callproc('tax_supplement_create',(rule_name,rate,start_time,end_time,target_days,contract_id))
	con.commit()
	con.close()
	

def tax_supplement_delete(delete_supplement_table):
	con.connect()
	delete_main = con.cursor()
	for contract_id,rule_id in delete_supplement_table.values:
		delete_main.callproc('tax_supplement_delete',(contract_id,rule_id))
	con.commit()
	con.close()

def tax_supplement_edit(edit_supplement_table):
	con.connect()
	update_main = con.cursor()
	for input_rule_id,input_rule_name,input_rate,input_start,input_end,input_days in edit_supplement_table.values:
		update_main.callproc('tax_supplement_edit',(input_rule_id,input_rule_name,input_rate,input_start,input_end,input_days))
	con.commit()
	con.close()
	
	
def tax_supplement_get(contract_id):
	select_main = connect() 
	select_main.callproc('tax_supplement_get',(contract_id,))
	rows = select_main.fetchall()
	con.commit()
	con.close()
	return rows

'''thread functions'''


def search_forums(query):
	select_main = connect() 
	select_main.callproc('search_forums',(query,))
	rows = select_main.fetchall()
	#thread = {'id':rows[0][0], 'title':rows[0][1],'post':rows[0][2],'stamp':rows[0][3],'when_was':rows[0][4],'author':rows[0][5]}
	con.commit()
	return rows

def thread_main(thread_id):
	select_main = connect() 
	select_main.callproc('crud_thread',(thread_id,))
	rows = select_main.fetchall()
	thread = {'id':rows[0][0], 'title':rows[0][1],'post':rows[0][2],'stamp':rows[0][3],'when_was':rows[0][4],'author':rows[0][5]}
	con.commit()
	return thread


def thread_reply(thread_id, reply,username):
	insert_main = connect()
	insert_main.callproc('crud_thread_insert',(thread_id, reply,username))
	con.commit()
	
def reply_reply(input_reply_id,input_username,input_reply):
	insert_main = connect()
	insert_main.callproc('crud_reply_insert',(input_reply_id,input_username,input_reply))
	con.commit()

def crud_thread_read(thread):
	select_main = connect() 
	select_main.callproc('crud_thread_read',(thread,))
	rows = select_main.fetchall()
	con.commit()
	if any(rows):
		reply_ids = [i[0] for i in rows]
		thread_id = [i[1] for i in rows]
		username = [i[2] for i in rows]
		reply = [i[3] for i in rows]
		stamp = [i[4] for i in rows]
		when_was = [i[5] for i in rows]
		replies = zip(reply_ids,thread_id,username,reply,stamp,when_was)
		return replies
	replies = False
	return replies
	
def crud_reply_read(thread):
	select_main = connect() 
	select_main.callproc('crud_reply_read',(thread,))
	rows = select_main.fetchall()
	con.commit()
	if any(rows):
		reply_reply = {i[1]:[] for i in rows}
		for i in rows:
			temp = {}
			temp['comment_id'] =  i[2]
			temp['username'] =  i[3]
			temp['reply'] =  i[4]
			temp['stamp'] =  i[5]
			temp['when_was'] =  i[6]
			reply_reply[i[1]].append(temp)
		return reply_reply
	reply_reply = False
	return reply_reply
	
'''calendar functions'''

def check_calendar_exists(date):
	select_main = connect()
	select_main.callproc('check_calendar_exists',(date,))
	is_exists = select_main.fetchone()
	con.commit()
	con.close()
	return is_exists
	
def check_admin_employers(username):
	select_main = connect()
	select_main.callproc('check_admin_employers',(username,))
	admin_employers = select_main.fetchall()
	admin_employers = [i[0] for i in admin_employers]
	con.commit()
	con.close()
	return admin_employers
	
def check_day_tasks(date,username):
	select_main = connect()
	select_main.callproc('check_day_tasks',(date,username))
	rows = select_main.fetchall()
	con.commit()
	columns =  [i[0] for i in select_main.description]
	cal_data = pd.DataFrame(rows)
	if len(cal_data) == 0:
		return cal_data
	cal_data.columns = columns
	cal_data = cal_data.sort_values('start_time')
	cal_data = cal_data.set_index('db_date',drop=True)
	return cal_data


def check_calendar_v2(start_time,end_time,username):
	con.connect()
	select_main = con.cursor()
	select_main.callproc('check_calendar_v2',(start_time,end_time,username))
	con.commit()
	rows = select_main.fetchall()
	columns =  [i[0] for i in select_main.description]
	cal_data = pd.DataFrame(rows)
	if len(cal_data) == 0:
		return cal_data
	cal_data.columns = columns
	cal_data = cal_data.sort_values('start_time')
	cal_data = cal_data.set_index('db_date',drop=True)
	return cal_data


def deposit_google_tasks(google_get):
	insert_main = connect()
	for start_time,end_time,username,category,title in google_get.values:
		insert_main.callproc('create_new_task',(str(start_time),str(end_time),username,category,title))
	con.commit()

def calendar_delete_task(cal_id):
	delete_main = connect()
	delete_main.callproc('calendar_delete_task',(cal_id,))
	con.commit()
	con.close()

def calendar_update_task(cal_id,category,title,start_time,end_time):
	update_main = connect()
	update_main.callproc('calendar_update_task',(cal_id,category,title,str(start_time),str(end_time)))
	con.commit()
	con.close()


def create_new_task(start_time,end_time,username,category,title):
	insert_main = connect()
	insert_main.callproc('create_new_task',(str(start_time),str(end_time),username,category,title))
	con.commit()


'''home page functions'''

def home_crud_first():
	select_main = connect()
	select_main.execute('call crud_dashboard()')
	rows = select_main.fetchall()
	con.commit()
	return rows

def calendar_dashboard(username):
	select_main = connect()
	select_main.callproc('calendar_dashboard',(username,))
	con.commit()
	rows = select_main.fetchall()
	return rows
