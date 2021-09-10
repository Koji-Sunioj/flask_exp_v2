DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `calendar_dashboard`(
    IN session_username	varchar(255)
)
begin

select start_time,end_time,category,title 
from calendar 
where username = session_username 
and start_time >= date(now())
order by start_time asc LIMIT 1
;

END$$
DELIMITER ;


DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `calendar_delete_task`(
    IN input_cal_id int
)
BEGIN
delete from geo_data.calendar where cal_id = input_cal_id;

END$$
DELIMITER ;


DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `calendar_update_task`(
    IN input_cal_id int,
    IN input_category varchar(255),
    IN input_title varchar(255),
    IN input_start_time datetime,
    IN input_end_time datetime
    
)
BEGIN
update geo_data.calendar
set category = input_category, title = input_title, start_time = input_start_time, end_time = input_end_time
where cal_id = input_cal_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_admin_employers`(
    IN input_username	varchar(255)
)
begin

SELECT employer FROM users
join employer on users.username = employer.username
where users.username = input_username;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_calendar_data`(
	IN cal_date datetime,
    IN session_username	varchar(255)
)
begin

SELECT cal_id,timestamp(date(start_time)) as 'db_date',start_time,end_time,category,title
FROM geo_data.calendar 
where month(start_time) = month(cal_date) 
and 
year(start_time) =  year(cal_date) 
and 
username = session_username
order by start_time asc;


END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_calendar_v2`(
	IN cal_date_start datetime,
    IN cal_date_end datetime,
    IN session_username	varchar(255)
)
begin

SELECT cal_id,timestamp(date(start_time)) as 'db_date',start_time,end_time,title,category 
FROM geo_data.calendar 
where
start_time >= cal_date_start
and username = session_username
and end_time < cal_date_end;

END$$
DELIMITER ;


DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_day_tasks`(
	IN calendar_date	date,
    IN input_username	varchar(255)
)
begin

select cal_id,timestamp(date(start_time)) as 'db_date',start_time,end_time,title,category
from calendar 
where date(start_time) = calendar_date
and username = input_username
order by start_time asc;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_email_password`(
	IN email_username 	varchar(255),
    IN input_password	varchar(255)
)
begin

select username,email,home_town,role from users where 
email = email_username and password = input_password 
or 
username = email_username and password = input_password;


END$$
DELIMITER ;


DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_inserted_data`(
	IN input_year datetime,
    IN input_username varchar(255)
)
begin

select year(start_time),month(start_time) from calendar 
where start_time >= DATE_SUB(input_year,INTERVAL 1 MONTH) 
and end_time  <  DATE_SUB(DATE_ADD(input_year,INTERVAL 1 YEAR) ,INTERVAL 1 MONTH)
and username = input_username
and category = 'work'
group by year(start_time),month(start_time);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_new_user`(
	IN input_email	varchar(255),
    IN input_username	varchar(255)
)
begin

select username from users
where username = input_username
or email = input_email;


END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_roles`(
	IN session_username varchar(255)
)
begin

select exists(select username from users where username = session_username and role = 'admin') 
as 'db_admin';

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `create_new_task`(
    IN input_start_time datetime,
    IN input_end_time datetime,
	IN input_username varchar(255),
    IN input_category varchar(255),
    IN input_title varchar(255)
)
BEGIN
insert ignore into calendar (start_time,end_time,username,category,title) 
values (input_start_time,input_end_time,input_username,input_category,input_title);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `create_new_user`(
    IN input_username varchar(255),
    IN input_email varchar(255),
	IN input_home_town varchar(255),
    IN input_password varchar(255)
)
BEGIN
insert into users (username, email,home_town,password) values (input_username,input_email,input_home_town,input_password);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_create`(
    IN input_category TINYTEXT,
    IN input_post TEXT,
    IN input_username VARCHAR(255)
)
BEGIN
insert into crud (category, post,username) values (input_category,input_post,input_username);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_dashboard`()
BEGIN

SELECT category,post,stamp,when_was,username FROM geo_data.crud where stamp = (select max(stamp) from geo_data.crud);


END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_delete`(
    IN py_id int
)
BEGIN

delete from crud where id = py_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_read`()
BEGIN

SELECT id,category,post,stamp,when_was,username FROM geo_data.crud order by stamp desc;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_reply_insert`(
	IN input_reply_id 		int,
	IN input_username 		varchar(255),
	IN input_reply  		varchar(255)
)
BEGIN


insert into reply_comment (reply_id,username,comments) 
values (input_reply_id,input_username,input_reply);
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_reply_read`(
	IN input_thread_id	int
)
BEGIN

select thread_reply.thread_id,reply_comment.reply_id,comment_id,reply_comment.username,comments,reply_comment.stamp, reply_comment.when_was
from thread_reply
join reply_comment on reply_comment.reply_id = thread_reply.reply_id
where thread_id = input_thread_id
order by reply_comment.stamp desc;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_thread`(
    IN thread_id int
)
BEGIN

select id,category,post, stamp,when_was,username from geo_data.crud where id = thread_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_thread_insert`(
	IN input_thread_id 		int,
	IN input_username 		varchar(255),
	IN input_reply  		varchar(255)
)
BEGIN

insert into thread_reply (thread_id, reply,username) values (input_thread_id,input_reply,input_username);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_thread_read`(
	IN input_thread_id	int
)
BEGIN

	select reply_id,thread_id,username,reply,stamp,when_was from thread_reply
	where thread_id = input_thread_id
	order by stamp desc ;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_update_db`(
    IN py_id int,
    IN py_category TINYTEXT,
	IN py_post TEXT
    
    
)
BEGIN

UPDATE  crud 
SET 
    category = py_category,
    post = py_post
WHERE
    id = py_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `crud_update_form`(
    IN py_id int
)
BEGIN

select category,post from crud where id = py_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `search_forums`(
	IN search_input	varchar(255)
)
begin

SELECT id,category,post,stamp,when_was,username 
FROM geo_data.crud 
WHERE 
category like  CONCAT('%',search_input,'%')
or post like  CONCAT('%',search_input,'%')
or username like  CONCAT('%',search_input,'%')
or stamp like  CONCAT('%',search_input,'%')
order by stamp desc;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_check_inserted_data_v2`(
	IN input_year datetime,
    IN input_username varchar(255),
    IN input_employer varchar(255),
    IN input_paymonth_offset int
)
begin

select year(start_time),month(start_time) from calendar 
where start_time >= DATE_SUB(input_year,INTERVAL input_paymonth_offset MONTH) 
and end_time  <  DATE_SUB(DATE_ADD(input_year,INTERVAL 1 YEAR) ,INTERVAL input_paymonth_offset MONTH)
and username = input_username
and category = 'work'
and title like  CONCAT('%',input_employer,'%')
group by year(start_time),month(start_time);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_contract_create`(
    IN session_username varchar(255),
    IN input_employer varchar(255),
    IN input_paydate_month_offset int,
	IN input_base float
)
BEGIN

insert into employer (username,employer,paydate_month_offset,base)
values (session_username,input_employer,input_paydate_month_offset,input_base);
SELECT LAST_INSERT_ID();

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_contract_delete`(
  IN input_contract_id int
)
BEGIN

delete from employer where contract_id = input_contract_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_contract_edit`(
    IN input_contract_id int,
    IN input_target varchar(255),
    IN input_value float
)
BEGIN

SET @edit_contract = 

CONCAT('update employer set ',input_target,' = ',input_value,' where employer.contract_id = ',input_contract_id
);

PREPARE stmt FROM @edit_contract;
EXECUTE stmt;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_contract_get`(
    IN session_username	varchar(255),
    IN input_search_parameter varchar(255)
)
begin
if input_search_parameter is null then
	select contract_id,username,employer,paydate_month_offset,base
	from employer
	where username = session_username;

else
	select paydate_month_offset
	from employer
	where username = session_username
	and employer = input_search_parameter;
end if;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_rules_get`(
    IN input_username varchar(255)
)
begin

select rule_name,rate,start_time,end_time,target_days,employer
from contract_rule
join employer on employer.contract_id = contract_rule.contract_id
where employer.username = input_username;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_supplement_create`(
    IN input_rule_name varchar(255),
    IN input_rate float,
    IN input_start_time int,
	IN input_end_time int,
    IN input_target_days varchar(255),
    IN input_contract_id int
)
BEGIN

insert into contract_rule (rule_name,rate,start_time,end_time,target_days,contract_id)
values (input_rule_name,input_rate,input_start_time,input_end_time,input_target_days,input_contract_id);

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_supplement_delete`(
    IN input_contract_id int,
    IN input_rule_id int
)
BEGIN

delete from contract_rule where contract_id = input_contract_id and rule_id = input_rule_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_supplement_edit`(
    IN input_rule_id int,
    IN input_rule_name varchar(255),
    IN input_rate float,
    IN input_start int,
    IN input_end int,
    IN input_days varchar(255) 
)
BEGIN

update contract_rule
set rule_name = input_rule_name, rate = input_rate, start_time = input_start, end_time =input_end, target_days = input_days
where rule_id = input_rule_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_supplement_get`(
    IN input_contract_id	int
)
begin

select contract_id,rule_id,rule_name,rate,start_time,end_time,target_days from contract_rule 
where contract_id = input_contract_id;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_years_get`(
    IN input_username	varchar(255)
)
begin

select date(start_time) as 'work_day',
start_time,end_time 
from geo_data.calendar 
where category = 'work' 
and 
username = input_username
order by date(start_time) asc;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `tax_years_get_v2`(
    IN input_username	varchar(255),
    IN input_employer	varchar(255)
)
begin

select date(start_time) as 'work_day',
start_time,end_time,title
from geo_data.calendar 
where category = 'work' 
and username = input_username
and title like CONCAT('%',input_employer,'%')
order by date(start_time) asc;

END$$
DELIMITER ;

DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `user_profile_get`(
	IN session_username varchar(255)
)
begin

SELECT username,email,created,home_town,password FROM geo_data.users where username = session_username;


END$$
DELIMITER ;
