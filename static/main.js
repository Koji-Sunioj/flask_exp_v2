

function tax_year() 


{	
	//clear local storages if reloaded after ajax function called.
	if(localStorage.getItem("ajax"))
    {
	  $('#load_message').text('values updated');
	  $('#load_message').show();
	   localStorage.clear();
	}
	
	//!HIGHCHARTS MODULE ONLY!
	//highcharts start here
	
	var colors = ['#ffe6e6','#e6ecff','#e6ffe6','#f9e6ff','#fff9e6']
	var contract = []
	$('select[name=search_parameter] option').each(function(index)
	{	
		if (index == 0)
		{}
		else
		{
			contract.push($(this).val())
		}
	})

	var year_month_series = []
	var year_series = []
	
	//create header for each table based on their id

	if ($('table.dataframe.table')) {
		$('table.dataframe.table').each(function(index){

			$(this).find('th').each(function(s,t)
			{	
				var th_text = $(t).text()
				$(contract).each(function(enums) {
					if (th_text.includes(contract[enums]))
					{
						$(t).css('background-color',colors[contract.indexOf(contract[enums])]);
					}
				});
				
			});
			
			var table_id = $(this).attr('id');
			$(this).find('tr:last').css('background-color','#f0e9c7');
			$(this).find('td:last-child').css('background-color','#f0e9c7');
			$(this).before(`<h1>${table_id}</h1>`);
			
			//year tab
			year_series.push({
				name: table_id,
				data: [ parseFloat($(this).find('td:last').text().substring(1).replace(/,/g, ''))],
				type: 'column',

			}),
			//main tab
			year_month = {
				name: table_id,
				data: [],
				type: 'column'
			},

			//iterate through individual tables to arrays for highcharts
			$(this).find('tr').each(function(index) {
				var month = $(this).find('td:first').text();
				var estimate = $(this).find('td:last').text();
					if (isNaN(parseInt(month.substring(5, 7))))
					{	

					}
					else 
					{	
						year_month.data.push( {x:parseInt(month.substring(5, 7))-1,y: parseFloat(estimate.substring(1).replace(/,/g, '') )} );
					}
				}) ; 
			year_month_series.push(year_month);
		});
	}

	//only if the tables exist and spline exists
	if (year_month_series.length > 1 && $('#spline').data().spline) 
	{
		year_month_series.unshift($('#spline').data().spline);
	}
	
	function check21(arr) {
		return arr.name != yyyy;
	  }

	var not_this_year =  year_series.filter(check21);
	if (not_this_year.length > 1)
	{	var i = 0;
		var indexer = 0;
		$(not_this_year).each( function(index,element)
		{
			i = i + element.data[0];
			indexer = index;
		})
		var year_avg = i / not_this_year.length;
	};

	
	//higcharts rendering over here!
	//json for year, month euro estimates
	json_year_month = {
		
		title: 	{ text: `Estimated paychecks for ${contract}` },
		xAxis: 
		{ 	
			crosshair: true,
			categories: ['January','February','March','April','May','June','July','August','September','October','November','December'],
			title: 
			{
				text: 'month',
			}
		},
		yAxis: 
		{
			title: 
			{
			   text: 'Euros \u20AC'
			},
			
		 },
		 tooltip : {
			valuePrefix: '\u20AC '
		 },
		 series : year_month_series.reverse(),
		 subtitle : {
			text: 'by year, month'
		  },
		  lang: {
			noData: "no data! click here to add contract."
		},
		noData: {
			style: {
				fontWeight: 'bold',
				fontSize: '15px',
				color: '#303030'
			}
		}
	};

	//json array for estimate per year, with mean value
	json_years = {
		title: 	{ text: `Estimated paychecks for ${contract}` },
		xAxis: 
		{ 	
			categories: [''],
			title: 
			{
				text: 'by year',
			}
		},
		yAxis: 
		{	
			title: 
			{
				text: 'Euros \u20AC'
			},
		},
		tooltip : {
			valuePrefix: '\u20AC '
		},
		series : year_series.reverse(),
		subtitle : {
		text: 'by year'}
		};
		
		//if the average annual value is calculated, push into the array as a plotline
		if (year_avg) 
		{
			json_years.yAxis.plotLines =  [{
				color: 'orange',
				width: 2,
				value: year_avg,
				label: {
					text: `mean annual value (previous years): \u20AC  ${ parseFloat(year_avg.toFixed(2)).toLocaleString("en-US")}`,
					align: 'right',
					x: -10,
					color: 'orange',
					style: {
					
						font: '18px "Trebuchet MS", Verdana, sans-serif'
					}
				},
				
				
			}]
		}

		if ($('#perc').length)
		{
			perc_series =  $('#perc').data().perc;
			perc_series.xAxis.title = {text:'year, month'}
			perc_series.subtitle = {text:'by year, month'}
			perc_series.yAxis = 
			{
				labels:
				{
					format: '{value}%'
				}
			};
			perc_series.title = { text: `Percentage share of hourly supplements per month for ${contract} `};
			perc_series.chart = {type: 'area'};
			perc_series.plotOptions = {area: {stacking: 'percent'},series: {
				animation: false
			}};
			perc_series.tooltip = {
				valueSuffix: '% ',shared: true
			 };
		}
	//tabs over herer!
	$('#pay_years').on('click',function() {
	
		$('#highchart').highcharts(json_years);
	 Highcharts.setOptions({
	 lang: {
	   thousandsSep: ','
		   }
		});
	});

	$('#pay_year_month').on('click',function() {
	
		$('#highchart').highcharts(json_year_month);
	 Highcharts.setOptions({
	 lang: {
	   thousandsSep: ','
		   }
		});
	});

	$('#sup_year_month').on('click',function() {
	
		$('#highchart').highcharts(perc_series);
	 Highcharts.setOptions({
	 lang: {
	   thousandsSep: ','
		   }
		});
	});
    // end of tabs
	
	 $('#highchart').highcharts(json_year_month);
	 Highcharts.setOptions({
	 lang: {
	   thousandsSep: ','
		   }});

	//if no table exists, clicking on the div will render the form
	if (year_month_series.length == 0) 
	{
		$('#highchart_tab').hide();
		$('#highchart').on('click',function() 
		{
			$('#new_contract').modal('show');
		})

	}
	
	var original_record = JSON.parse($('#original_record').val());
	var originalContent = $('#settings_body').html();
	var json_change = {
		"edit_contract":[],
		"delete_rule":[],
		"add_rule":[],
		"edit_rule": []
	}

	$(document).on('click',"#cancel_changes",function(){
		
			$('#settings_body').html(originalContent);

			json_change = {
				"edit_contract":[],
				"delete_rule":[],
				"add_rule":[],
				"edit_rule": []
			}
			$('#edit_message').removeClass();
			$('#edit_message').addClass('alert');
			$('#edit_message').text('');
			$('#save_changes').prop('disabled',true);
		})
	
	function normalize_modal_contract()
	{
		//uncheck supplement box, remove values so it isn't submitted
		$('#add_supplement input:checkbox').prop( "checked", false );
		$('#add_supplement').hide();
		//uncheck years box, remove values so it isn't submitted
		$('#add_google_years input:checkbox').prop( "checked", false );
		$('#add_google_years').hide();
		//uncheck supplement box, remove values so it isn't submitted
		$('#supplement_table tbody tr').remove();
		$("#supplement_table").hide();
		$('#create_contract').hide();
		$('#new_contract_years').hide();
		$("#parse_years option:selected").prop("selected", false)
	}

	//set width of table for supplement values
	$('#cloner tr td').css('width','20%');	

	//set css values for values in data table whose age is this month, or more
	var today = new Date();
	var mm = String(today.getMonth() + 2).padStart(2, '0');
	var yyyy = today.getFullYear();
	var today =yyyy + '-'+  mm;
	var this_month = $(`#${yyyy}`).find(`td:contains(${today})`);
	this_month.parent().css('color','blue').attr('title', 'fetched from Google calendar');
	this_month.parent().nextAll().prev().css('color','blue').attr('title', 'fetched from Google calendar');

	function from_hidden_to_cells(parent_finder,in_progress_arr) {
		//grab the text values from the cells in plain format (no markup)
		parent_finder.find('td:eq(1)').text(in_progress_arr[0]);
		parent_finder.find('td:eq(2)').text(in_progress_arr[1]);
		parent_finder.find('td:eq(3)').text(in_progress_arr[2]);
		parent_finder.find('td:eq(4)').text(in_progress_arr[3]);
		parent_finder.find('td:eq(5)').text(in_progress_arr[4]);
	}

	function from_numbers_to_days(day_numbers) {
		var days = {
			Mon: 0,
			Tue: 1,
			Wed: 2,
			Thur: 3,
			Fri: 4,
			Sat: 5,
			Sun: 6
		}
		day_numbers = day_numbers.split(",").map(function(item) {
		return days[item.trim()]})
		return day_numbers
	};

	function from_days_to_days(day_numbers) {
		var days = {
			Mon: 'Monday',
			Tue: 'Tuesday',
			Wed: 'Wednesday',
			Thur: 'Thursday',
			Fri: 'Friday',
			Sat: 'Saturday',
			Sun: 'Sunday'
		}
		day_names = day_numbers.split(",").map(function(item) {
		return days[item.trim()]})
		return day_names
	};

	function filter_prev(contract_id,target)
	{
		$(json_change.edit_contract).each(function(i,r)
		{
			//if rate same as record, target is base and contract ID is the same: delete it 
			if (r.target === target && r.contract_id ===  contract_id)
			{
				json_change.edit_contract.splice([i],1);
				console.log('success');
			}
		});
	}

	function normalize_supplement(parent_finder,to_save_json,days,hidden_arr)
	{
		//add to html cells
		parent_finder.find('td:eq(1)').text(to_save_json.name);
		parent_finder.find('td:eq(2)').text(to_save_json.rate);
		parent_finder.find('td:eq(3)').text(to_save_json.start + ':00');
		parent_finder.find('td:eq(4)').text(to_save_json.end + ':00');
		
		//filter back to day names, place back in cell, place button and remove hidden array
		var result = [];
		for(var i in days)
		if (to_save_json.days.includes(days[i]))
			result.push(i);
		
		
		parent_finder.find('td:eq(5)').text(result.join(", "));
		
		//works fine
		parent_finder.find('td:first').html('<button class="btn btn-link in_edit" style="padding: 0px;color:red;" name="del_existing_supplement">x</button>');
		parent_finder.find('td:last').html('<button class="btn btn-link in_edit" style="padding: 0px;" name="edit_existing_supplement">&#x270E;</button>');
		parent_finder.find('button.btn-link.in_edit').show();
		hidden_arr.remove();

	}

	function normalize_cards()
	{
		$('input[name=in_contract_progress]').each(function(index,value)
		{
			value = $(value);
			var in_progress_arr = value.val().split('-');
			var header = $(this).parents().eq(5);
			
			if (header.find('button[name=save_header_details').length > 0) 
			{
				header.find('button[name=save_header_details').replaceWith('<button class="btn btn-link in_edit" name="edit_employer" style="display: inline-block">&#x270E;</button>');
				header.find('tr[name=contract_header] td:first').text(in_progress_arr[0]);
				header.find('tr[name=contract_header] td:last').text(in_progress_arr[1]);
			}
			header.find('input[name=in_contract_progress]').remove();
			header.find('button.btn.in_edit:not(button[name=un_del_employer])').hide();	

		});

		$('input[name=in_progress]').each(function(index,value) {
			var parent_finder = $(this).parent();
			value = $(value);
			var in_progress_arr = value.val().split('-');
			from_hidden_to_cells(parent_finder,in_progress_arr);
			console.log('cells rendered correctly');

			if (parent_finder.find('button[name=save_existing_rule]').length > 0)
			{	
				//place the buttons, show them. they will be hidden after toggle main button.
				parent_finder.find('td:first').html('<button class="btn btn-link in_edit" style="padding: 0px;color:red;" name="del_existing_supplement">x</button>');
				parent_finder.find('td:last').html('<button class="btn btn-link in_edit" style="padding: 0px;" name="edit_existing_supplement">&#x270E;</button>');
				parent_finder.find('button.btn-link.in_edit').hide();
			}
				
			else if (parent_finder.find('button[name=save_appended').length > 0) 
			{	
				//if there is an appended row in progress, render back the values which are not saved.
				days = from_numbers_to_days(in_progress_arr[4]);
				json_change.add_rule.push({
					"contract_id":$(this).parents().eq(4).attr('id'),
					"name":in_progress_arr[0],
					"rate":in_progress_arr[1],
					"start":in_progress_arr[2].trim().split(':')[0],
					"end":in_progress_arr[3].trim().split(':')[0],
					"days":days
					});
				console.log('days translated');
				parent_finder.find('td:last').html("<button class='btn btn-link in_edit' style='padding: 0px;color:#0d6efd;' name='edit_appended'>&#x270E;</button>");
				parent_finder.find('button.btn-link.in_edit').hide();	
			}
			parent_finder.find('input[name=in_progress]').remove();});
			$('.appended').remove();

	}

	function check_existing(parent_finder,existing_rules)
	{	

		$(parent_finder).parents().eq(2).find('tbody[name=customize_supplements] tr td:nth-child(2)').each(function(index,value)
		{	

			if ($(value).text().length > 0)
			{
				existing_rules.push($(value).text());
			}
			else if ($(value).find('input[name=sup_name]').val().length > 0)
			{
				existing_rules.push($(value).find('input[name=sup_name]').val());
			}
			
		})
	}

	function alert_in_edit(message,alert_type)
	{
		$('#edit_message').removeClass();
		$('#edit_message').addClass('alert ' + alert_type);
		$('#edit_message').text(message);
		$('#edit_message').fadeIn();
	}


	function check_save_button()
	{
		if (json_change.delete_rule.length > 0   || json_change.edit_rule.length > 0  || json_change.add_rule.length > 0 || json_change.edit_contract.length > 0)
		{
			$('#save_changes').prop('disabled', false);
		}

		else if (json_change.delete_rule.length == 0  && json_change.edit_rule.length == 0  && json_change.add_rule.length == 0 && json_change.edit_contract.length == 0)
		{
			$('#save_changes').prop('disabled', true);
		}
	}

	$(document).on('click','button[name=edit_employer]',function()
	
	{	
		
		//change the button to save button
		var target_card = $(this).parents().eq(5);

		alert_in_edit(`editing base hourly rate and pay month for ${target_card.find('button[name=edit_contract]').text()}`,'alert-secondary');

		var current_offset = target_card.find('tr[name=contract_header] td:first').text().trim();
		var current_rate = target_card.find('tr[name=contract_header] td:last').text().replace(/€/g, "").trim();

		var in_progress = current_offset +'-'+ current_rate
		target_card.find('tr[name=contract_header]').append(`<input type="hidden" value="${in_progress}" name="in_contract_progress">`);

		target_card.find('tr[name=contract_header] td:first').html(`<input name="offset" class="form-control" value=${current_offset} type="text" style="text-align: center; padding: 0px;">`)
		target_card.find('tr[name=contract_header] td:last').html(`<input name="base" class="form-control" value=${current_rate} type="text" style="text-align: center; padding: 0px;">`)
		
		$(this).parent().html('<button class="btn btn-link in_edit" name="save_header_details" style="color: green; display: inline-block;">&#10003;</button>');
		
	});

	$(document).on('click','button[name=save_header_details]',function()
	
	{	var target_card = $(this).parents().eq(5);
		var new_offset  =  parseInt(target_card.find('tr[name=contract_header] input[name=offset]').val().trim());
		var new_rate  = parseFloat(target_card.find('tr[name=contract_header] input[name=base]').val().trim());
		var contract_id= parseInt($(this).parents().eq(5).attr('id'));
	
		if (new_offset > 2 || new_offset.length == 0 || $.isNumeric( new_offset) == false)
		{
			alert_in_edit('pay month is more than two months in the future, empty or is not numeric','alert-warning');
		} 

		else if  (new_rate.length == 0 || $.isNumeric(new_rate) == false)

		{
			alert_in_edit('hourly rate is empty or non numeric','alert-warning');
		}

		else 
		{
			//reverse state of button
			target_card.find('input[name=in_contract_progress]').remove();
			target_card.find('tr[name=contract_header] td:first').text(new_offset);
			target_card.find('tr[name=contract_header] td:last').text(new_rate);
			$(this).parent().html('<button class="btn btn-link in_edit" name="edit_employer" style="display: inline-block">&#x270E;</button>');

			$(original_record).each(function(index,record)
			{
				if(record.contract_id == contract_id)
				{
					//conditionals for the base rate
					//if the record is not the same, send to array. duplicate entries are always filtered.
					if (record.base !== new_rate)
					{
						//destroy previous value of same contract id and command
						filter_prev(contract_id,'base');
						//push the value forward
						var rate_message = `updated hourly rate for ${target_card.find('button[name=edit_contract]').text()} to ${new_rate}. `;
						json_change.edit_contract.push({
							"contract_id":contract_id,
							"command": "update",
							"target":"base",
							"value":new_rate 
						});
						//take care of html values 
						target_card.find('tr[name=contract_header] td:last').css('color','blue');
						target_card.find('tr[name=contract_header] td:last').attr('title','base rate to be updated' );	
					}
					//if the rate is the same as record
					else if (record.base === new_rate)
					{	
						//...and array is empty, meaning nothing ever saved: do nothing. cannot loop through empty array
						if(json_change.edit_contract.length == 0)
						{
							rate_message = `hourly rate is same as original contract for for ${target_card.find('button[name=edit_contract]').text()}: no changes made. `;
						}

						//...and array has length, meaning there was a previously saved value
						else 
						{
							rate_message = `hourly rate is same as original contract for for ${target_card.find('button[name=edit_contract]').text()}: no changes made. `;
							filter_prev(contract_id,'base');
							target_card.find('tr[name=contract_header] td:last').css('color','');
							target_card.find('tr[name=contract_header] td:last').attr('title','');
						}
					}

					//conditionals for the offset
					if (record.paydate_month_offset !== new_offset)
					{	
						//destroy previous value of same contract id and command
						filter_prev(contract_id,'paydate_month_offset');
						//push values forward
						var offset_message = `updated pay month for ${target_card.find('button[name=edit_contract]').text()} to ${new_offset} month in advance. `;
						json_change.edit_contract.push({
							"contract_id":contract_id,
							"command": "update",
							"target":"paydate_month_offset",
							"value":new_offset 
						});
						target_card.find('tr[name=contract_header] td:first').css('color','blue');
						target_card.find('tr[name=contract_header] td:first').attr('title','payment month to be updated');
					
					
					}
					else if (record.paydate_month_offset == new_offset) 
					{	

						if(json_change.edit_contract.length == 0)
						{
							offset_message = `same pay month for ${target_card.find('button[name=edit_contract]').text()} as original contract: no changes made. `;
						}
						else
						{
							filter_prev(contract_id,'paydate_month_offset');
							offset_message = `same pay month for ${target_card.find('button[name=edit_contract]').text()} as original contract: no changes made. `;
							target_card.find('tr[name=contract_header] td:first').css('color','');
							target_card.find('tr[name=contract_header] td:first').attr('title','');
						}
					}
					alert_in_edit(`${rate_message.concat(offset_message)}`,'alert-success');
					//alert_in_edit(`no changes made to employer name ${target_card.find('button[name=edit_contract]').text()}`,'alert-light');
					var unique = Array.from(new Set(json_change.edit_contract.map(JSON.stringify))).map(JSON.parse);
					json_change.edit_contract = unique;
				}
			});
		}
		check_save_button();
	});

	//delete employer function
	$(document).on('click','button[name=del_employer]',function() 
	{	
		var contract_id= parseInt($(this).parents().eq(5).attr('id'));
		var target_card = $(this).parents().eq(5);
		target_card.find(".in_edit:not(:first)").hide();
		target_card.find("button[name=edit_contract]").attr('disabled',true);

		target_card.toggleClass('to_trash');
		json_change.edit_contract.push({
			"contract_id":contract_id,
			"command": "delete"
		})
		$(this).attr('name','un_del_employer');

		normalize_cards();
		alert_in_edit(`${target_card.find('button[name=edit_contract]').text()} will be deleted`,'alert-danger');
		check_save_button();
	});



	$(document).on('click','button[name=un_del_employer]',function() 
	{	
		//we want the same effects of selecting the card as in edit contract
		$(this).attr('name','del_employer');
		var target_card = $(this).parents().eq(5);
		var other_cards = $(this).parents().eq(6).siblings();
		target_card.find(".in_edit:not(:first)").show();
		target_card.find("button[name=edit_contract]").attr('disabled',false);
		target_card.toggleClass('to_trash');
		
		var contract_id=  parseInt($(this).parents().eq(5).attr('id'));

		$(json_change.edit_contract).each(function(i,r)
		{
			if (r.contract_id === contract_id && r.command ===  "delete")
			{			
				json_change.edit_contract.splice([i],1);
			}
		});

		//cycle through other cards. if it in deletion, don't change. if in edit, hide all buttons
		$(other_cards).each(function(index,value)
		{
			if ($(value).find('.edit_progress.to_trash').length > 0)
			{
				return  true;
			}

			else 
			{
				$(value).children('div').removeClass('edit_progress');
				$(value).find('button.btn.in_edit').hide();	
				$(value).find('button[name=edit_contract]').removeClass('pressed');
			}
		});

		normalize_cards();
		alert_in_edit(`${target_card.find('button[name=edit_contract]').text()} removed from deletion`,'alert-success');
		check_save_button();
	});


	$(document).on('click','button[name=edit_contract]',function() 
	//render the editing buttons in the table
	{	
		Event.preventDefault;
		//if hidden input exists, grab the value from it, split it by the dashes, and place it in the cells. then remove the hidden input
		//if the input is there, we need to add it to the json array
		normalize_cards();
		//ending actions
		//toggle visibility on current card
		var target_card = $(this).parents().eq(6);
		target_card.toggleClass('edit_progress');
		target_card.find('button.btn.in_edit').toggle();
		
		//need to make sure the edit buttons for deleted rules stay hidden because they are toggled on edit_contract.
		$.each(json_change.delete_rule,function(index,value)
		{
			
			$(`#${value.rule_id}`).find('button[name=edit_existing_supplement]').hide();
		})

		//dealing with visibility of buttons and delete / progress selections of other cards here
		var other_cards = $(this).parents().eq(7).siblings();
		$(other_cards).each( function(index,value){

			if ($(value).find('.edit_progress.to_trash').length > 0)
			{
				$(value).find('button.btn.in_edit:not(button[name=un_del_employer])').hide();
			}
			else 
			{
				$(value).find('button[name=edit_contract]').removeClass('pressed');
				$(value).find('button.btn.in_edit:not(button[name=un_del_employer])').hide();
				$(value).find('div.card.edit_progress').removeClass('edit_progress');
			}
		})

		if($(this).hasClass('pressed') )
		{
			$(this).removeClass('pressed');
			alert_in_edit(`${target_card.find('button[name=edit_contract]').text()} unselected from editing`,'alert-secondary');
		}
		else 
		{
			$(this).addClass('pressed');
			alert_in_edit(`${target_card.find('button[name=edit_contract]').text()} selected for editing`,'alert-secondary');
		};

		console.log(json_change);
	
	})

	//APPEND FUNCTIONS
	//1. edit new row
	$(document).on('click','button[name=edit_appended]',function() {

		//a. grab the id, supplement name, and remove from json since the value might change
		var contract_id= $(this).parents().eq(5).attr('id');
		var added_supp_name =  $(this).parents().eq(1).find('td:eq(1)').text();
		
		$(json_change.add_rule).each(function(index,value)
		{
			 if(value.name == added_supp_name && value.contract_id == contract_id)
			 {
				 delete json_change.add_rule[index];
				 json_change.add_rule = json_change.add_rule.filter(val => val)
			 }
		})

		//b. clone the html markup for select option start, end times and day drop downs.
		var clone_start = $('#clone_to_contract').find('select[name=start_times]').parent().html();
		var clone_end = $('#clone_to_contract').find('select[name=end_times]').parent().html();
		var day_drops = $('#clone_to_contract').find('td:eq(5)').html();
		
		//c. declare variables from each cell. 
		var parent_finder = $(this).parents().eq(1);
		var supper = parent_finder.find('td:eq(1)').text().trim();
		var rater = parent_finder.find('td:eq(2)').text().trim();
		var start = parent_finder.find('td:eq(3)').text().trim().split(":", 1);
		var end = parent_finder.find('td:eq(4)').text().trim().split(":", 1);
		var saved_which = parent_finder.find('td:eq(5)').text(); 

		//d. save it in a string, and place it in hidden input
		var in_progress = supper +'-'+ rater +'-'+ start +'-'+ end +'-'+ saved_which
		parent_finder.append(`<input type="hidden" value="${in_progress}" name="in_progress">`)
		
		//e. send the values to the inputs
		parent_finder.find('td:eq(1)').html(`<input type="text" name="sup_name" class="form-control" style="text-align: center; padding: 0px;" value="${supper}">`);
		parent_finder.find('td:eq(2)').html(`<input type="text" name="rate"  class="form-control" style="text-align: center; padding: 0px;" value="${rater}">`);
		parent_finder.find('td:eq(3)').html(clone_start);
		parent_finder.find('select[name=start_times]').val(`${start}`);
		parent_finder.find('td:eq(4)').html(clone_end);
		parent_finder.find('select[name=end_times]').val(`${end}`);

		parent_finder.find('select[name=end_times] option').each(function()
		{	
			if ( parseInt($(this).val())  <= parseInt(start[0]) )
			{
				$(this).prop('disabled',true)
			}
		})
		parent_finder.find('td:eq(5)').html(day_drops);
		parent_finder.find('td:eq(5)').find('input[name=which]').val(saved_which);
		parent_finder.find('td:eq(5) button').text(saved_which);
		
		parent_finder.find('.dropdown_add').each(function(index,value){
			value = $(value);
			if (saved_which.includes(value.text()))
			{
				value.find('input').prop('checked', true);
			}
		})

		//toggle functionality
		parent_finder.find('td:last').html('<button class="btn btn-link in_edit" name="save_appended" style="color: green; padding: 0px;">&#10003;</button>');
		parent_finder.find('button.btn-link.in_edit').show();
		alert_in_edit(`supplement "${supper}" for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} in edit.`,'alert-secondary');

		  })


	//2. save new row
	$(document).on('click','button[name=save_appended]',function() {

		var parent_finder = $(this).parents().eq(1);
		var to_json_arr = [];
		var existing_rules = []

		check_existing(parent_finder,existing_rules);

		var contract_id= $(this).parents().eq(5).attr('id');
		to_json_arr.push(contract_id);

		var supp_name = parent_finder.find('input[name=sup_name]').val();
		var rater = parent_finder.find('input[name=rate]').val();
		var starter = parent_finder.find('select[name=start_times]').val();
		var ender = parent_finder.find('select[name=end_times]').val();
		var whicher = parent_finder.find('input[name=which]').val();

		//if any fields are empty
		if (!supp_name || !rater || !starter || !ender || !whicher)
		{
			var message = 'one or more fields are empty';
			var alert_type = 'alert-warning';
			alert_in_edit(message,alert_type);
			
		}
		//or the name of the rule is not unique for that table
		else if (new Set(existing_rules).size != existing_rules.length)
		{
			var message = 'supplement name must be unique per employer';
			var alert_type = 'alert-warning';
			alert_in_edit(message,alert_type);
		}
		//or the rate field has letters
		else if (/[a-z]/i.test(rater))
		{
			var message = 'rate field containts letters';
			var alert_type = 'alert-warning';
			alert_in_edit(message,alert_type);
		}
		//no problems, will save.
		else
		{ 
			parent_finder.attr('class','save_appended');
			parent_finder.find('input[name=in_progress]').remove();

			//toggle functionality
			parent_finder.find('td:first').html('<button class="btn btn-link in_edit" name="del_appended" style="color: red; padding: 0px;">x</button>');
			parent_finder.find('td:last').html("<button class='btn btn-link in_edit' style='padding: 0px;color:#0d6efd;' name='edit_appended'>&#x270E;</button>");
			parent_finder.find('button.btn-link.in_edit').show();
			
			parent_finder.find('input[name=sup_name], input[name=rate],select[name=start_times],select[name=end_times],input[name=which]').map(function(index){
					
				to_json_arr.push($(this).val());
				if (index == 2 || index == 3)
				{
					$(this).replaceWith($(this).val()+':00' );
				}

				else if(index == 4 )
				{
					var hidden_arr = $(this).val();
					$(this).parent().replaceWith(hidden_arr)
				}
				
				else 
				{
					$(this).replaceWith($(this).val() );
				}
				;});

				days = from_numbers_to_days(to_json_arr[5]);

				  json_change.add_rule.push(
					{
					  "contract_id":to_json_arr[0],
					  "name":to_json_arr[1].trim(),
					  "rate":to_json_arr[2],
					  "start":to_json_arr[3],
					  "end":to_json_arr[4],
						"days":	days
					});
				
			$(this).parents().eq(1).find('.btn.btn-link').remove();
			$('.save_appended').css('color','green');
			$('.save_appended').attr('title','supplement to be added')
			var message = `supplement "${to_json_arr[1]}" was added at rate ${to_json_arr[2]} between the times of ${to_json_arr[3]}:00 and ${to_json_arr[4]}:00 for the days of ${from_days_to_days(to_json_arr[5]).join(', ')}, under employer ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()}` ;
			var alert_type = 'alert-success';
			alert_in_edit(message,alert_type);
			check_save_button();
		}
	})

	//3. delete new row
	$(document).on('click','button[name=del_appended]',function() {
		var employer = $(this).parents().eq(5).find('button[name=edit_contract]').text();
		var contract_id= $(this).parents().eq(5).attr('id');
		var added_supp_name =  $(this).parents().eq(1).find('td:eq(1)').text();
		$(json_change.add_rule).each(function(index,value)
		{
			 if(value.name == added_supp_name && value.contract_id == contract_id)
			 {
				 delete json_change.add_rule[index];
				 json_change.add_rule = json_change.add_rule.filter(val => val)
			 }
		})
		  $(this).parents().eq(1).remove();
		  alert_in_edit(`supplement "${added_supp_name}" for ${employer} deleted.`,'alert-danger');
		  check_save_button();
	})

	//EXISTING SUPPLEMENT BUTTONS
	//1. edit the existing row in table
	$(document).on('click','button[name=edit_existing_supplement]', function() {

		var parent_finder = $(this).parents().eq(1);

		if (parent_finder.attr('title'))
		
		{
			parent_finder.removeClass() ;
			parent_finder.removeAttr('title');
			
		}
		
		var rule_id = parent_finder.attr('id');
		json_change.delete_rule = json_change.delete_rule.filter(item => item !== rule_id)
		
		var clone_start = $('#clone_to_contract').find('select[name=start_times]').parent().html();
		var clone_end = $('#clone_to_contract').find('select[name=end_times]').parent().html();
		var day_drops = $('#clone_to_contract').find('td:eq(5)').html();
		
		var supper = parent_finder.find('td:eq(1)').text().trim();
		var rater = parent_finder.find('td:eq(2)').text().replace(/€/g, "").trim();  
		var start = parent_finder.find('td:eq(3)').text().trim().split(":", 1);
		var end = parent_finder.find('td:eq(4)').text().trim().split(":", 1);
		var saved_which = parent_finder.find('td:eq(5)').text(); 

		var in_progress = supper +'-'+ rater +'-'+ parent_finder.find('td:eq(3)').text().trim() +'-'+ parent_finder.find('td:eq(4)').text().trim() +'-'+ saved_which
		parent_finder.find('input[name=in_progress]').remove();
		parent_finder.append(`<input type="hidden" value="${in_progress}" name="in_progress">`)
		
		parent_finder.find('td:eq(1)').html(`<input type="text" name="sup_name" class="form-control" style="text-align: center; padding: 0px;" value="${supper}">`);
		parent_finder.find('td:eq(2)').html(`<input type="text" name="rate"  class="form-control" style="text-align: center; padding: 0px;" value="${rater}">`);
		parent_finder.find('td:eq(3)').html(clone_start);
		parent_finder.find('select[name=start_times]').val(`${start}`);
		parent_finder.find('td:eq(4)').html(clone_end);
		parent_finder.find('select[name=end_times]').val(`${end}`);

		parent_finder.find('select[name=end_times] option').each(function()
		{	
			if ( parseInt($(this).val())  <= parseInt(start[0]) )
			{
				$(this).prop('disabled',true)
			}
		})
		parent_finder.find('td:eq(5)').html(day_drops);
		parent_finder.find('td:eq(5)').find('input[name=which]').val(saved_which);
		parent_finder.find('td:eq(5) button').text(saved_which);

		
		parent_finder.find('.dropdown_add').each(function(index,value){
			value = $(value);
			
			if (saved_which.includes(value.text().trim()))
			{
				value.find('input').prop('checked', true);
			}
		})

		//we add the buttons, otherwise they would not appear since default value is hidden. don't need to toggle them. if the main
		//button is hit, the buttons will be replaced and toggled 
		parent_finder.find('td:first').html('<button class="btn btn-link" style="padding: 0px;color:red;" name="del_existing_supplement">x</button>');
		parent_finder.find('td:last').html('<button class="btn btn-link" name="save_existing_rule" style="color: green; padding: 0px;">&#10003;</button>');
		
		
		alert_in_edit(`supplement "${supper}" for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} in edit.`,'alert-secondary');	
	})

	//2. save the edited rule
	$(document).on('click','button[name=save_existing_rule]', function() {
		
		var parent_finder = $(this).parents().eq(1);
		var rule_id = parent_finder.attr('id');
		var contract_id= $(this).parents().eq(5).attr('id');
		var hidden_arr = parent_finder.find('input[name=in_progress]');
		var in_progress_arr = hidden_arr.val().split('-');
		var same_as_contract = false;

		var check_names = []

		check_existing(parent_finder,check_names);

		if (new Set(check_names).size != check_names.length)
		{
			same_as_contract = true;
			alert_in_edit(`supplement "${parent_finder.find('input[name=sup_name]').val()}" for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} already exists.`,'alert-warning');	
		}
	
		
		var days = {
			Mon: 0,
			Tue: 1,
			Wed: 2,
			Thur: 3,
			Fri: 4,
			Sat: 5,
			Sun: 6
		}

		var cleaned = in_progress_arr[4].split(",").map(function(item) {
			return days[item.trim()];
		});

		var in_progress_json = {
			"name":in_progress_arr[0],
			"rate":in_progress_arr[1],
			"start":in_progress_arr[2].split(':')[0],
			"end":in_progress_arr[3].split(':')[0],
			"days":	cleaned
			}
		//

		var to_save_json = {
			"contract_id":contract_id,
			"rule_id":rule_id,
			"name": parent_finder.find('input[name=sup_name]').val(),
			"rate": parent_finder.find('input[name=rate]').val(),
			"start": parent_finder.find('select[name=start_times]').val(),
			"end": parent_finder.find('select[name=end_times]').val(),
			"days":	 parent_finder.find('input[name=which]').val().split(",").map(function(item) {
				return days[item.trim()]}),
		}

	
		//comparing original values, delete from array if the same as server
		$(original_record).each(function(index,value)
		{
			if (value.contract_id == contract_id)
			{
				$(value.supplements).each(function(nested_index,nested_value)
				{
					if(nested_value[1] == rule_id)
					{
						if (nested_value[4] ==  parseInt(to_save_json.start) && nested_value[5] ==  parseInt(to_save_json.end) && 
							nested_value[2] ==  to_save_json.name && nested_value[3] == parseFloat(to_save_json.rate) &&
							nested_value[6] == JSON.stringify(to_save_json.days))
						
						{	
							normalize_supplement(parent_finder,to_save_json,days,hidden_arr);
							same_as_contract = true;
							json_change.edit_rule = json_change.edit_rule.filter(item => item.rule_id !== rule_id);
							parent_finder.css('color','');
							parent_finder.attr('title','');
							alert_in_edit(`supplement "${to_save_json.name}" for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} remains unchanged.`,'alert-success');
						}
					}
				});
			}
		});

		//if not the same, 
		if (same_as_contract == false)
		{
			//if its the same as the change array, leave it alone but re render html
			if ( in_progress_json.name == to_save_json.name && in_progress_json.rate == to_save_json.rate && 
				in_progress_json.start == to_save_json.start && in_progress_json.end == to_save_json.end 
				&& in_progress_json.days.sort().join(',') === to_save_json.days.sort().join(','))
			{
				normalize_supplement(parent_finder,to_save_json,days,hidden_arr);
				alert_in_edit(`supplement "${to_save_json.name}" between the times of ${to_save_json.start}:00 and ${to_save_json.end}:00 with rate ${to_save_json.rate} for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} updated.`,'alert-success');
			}

			//if not same as change array, push it there but make sure it doesn't exist anywhere else.
			else 
			{
				json_change.edit_rule = json_change.edit_rule.filter(item => item.rule_id !== rule_id);
				json_change.edit_rule.push(to_save_json);
				json_change.delete_rule = json_change.delete_rule.filter(item => item.rule_id !== rule_id);
				console.log('no changes')
				normalize_supplement(parent_finder,to_save_json,days,hidden_arr); 
				parent_finder.css('color','blue');
				parent_finder.attr('title','supplement to be edited');
				alert_in_edit(`supplement "${to_save_json.name}" between the times of ${to_save_json.start}:00 and ${to_save_json.end}:00 with rate ${to_save_json.rate} for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} updated.`,'alert-success');
			}
		}
		check_save_button();	
	})



	//3. delete. needs work for deleting and undeleting
	$(document).on('click','button[name=del_existing_supplement]', function() {
		//in_edit's default property is hidden, so need to make sure it shows
		$(this).attr('name','un_del_existing_supplement').addClass('in_edit').show();
		$(this).parents().eq(1).addClass('text-danger text-decoration-line-through').attr('title','marked for deletion');
		parent_finder = $(this).parents().eq(1);
		//if there is a hidden input, meaning edit in progress
		if ($(this).parents().eq(1).find('input[name=in_progress]').length == 1)
		{	
			console.log("hidden array found");
			hidden_arr = $(this).parents().eq(1).find('input[name=in_progress]');
			var in_progress_arr = hidden_arr.val().split('-');
			parent_finder.find('td:eq(1)').text(in_progress_arr[0]);
			parent_finder.find('td:eq(2)').text(in_progress_arr[1]);
			parent_finder.find('td:eq(3)').text(in_progress_arr[2]);
			parent_finder.find('td:eq(4)').text(in_progress_arr[3]);
			parent_finder.find('td:eq(5)').text(in_progress_arr[4]);
			//again, default is hidden so we want it to remain that way 
			parent_finder.find('td:last').html('<button class="btn btn-link" style="padding: 0px;" name="edit_existing_supplement">&#x270E;</button>');
			hidden_arr.remove();
		}
		parent_finder.find('button[name=edit_existing_supplement]').addClass('in_edit').hide();
		
		var rule_id = $(this).parents().eq(1).attr('id');
		var contract_id= $(this).parents().eq(5).attr('id');
		json_change.edit_rule = json_change.edit_rule.filter(item => item.rule_id !== rule_id);
		json_change.delete_rule.push(
			{ "contract_id":contract_id,
			   "rule_id":rule_id
			}
		);
		alert_in_edit(`supplement "${parent_finder.find('td:eq(1)').text()}" for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()}  marked for deletion`,'alert-danger');
		check_save_button();
	})

	//4. needs work
	$(document).on('click','button[name=un_del_existing_supplement]', function() {
		
		$(this).removeAttr('name').attr('name','del_existing_supplement');
		parent_finder = $(this).parents().eq(1);
		parent_finder.find('button[name=edit_existing_supplement]').show();
		parent_finder.removeClass('text-danger text-decoration-line-through').removeAttr('title');
		var rule_id = parent_finder.attr('id');
		json_change.delete_rule = json_change.delete_rule.filter(item => item.rule_id !== rule_id)
		
		alert_in_edit(`supplement "${parent_finder.find('td:eq(1)').text()}" for ${parent_finder.parents().eq(4).find('button[name=edit_contract]').text()} removed from deletion.`,'alert-success');
		check_save_button();
		//need to add back the edited data if was in progress
		
	})


	//PLUS MINUS BUTTON - APPEND OR DELETE NEW SUPPLEMENTS
	//1. adds new row to the end
	$(document).on('click','button[name=append_supplement_new]', function() {
		var cloned_row = $('#clone_to_contract tr').clone();
		var employer = $(this).parents().eq(3).find('button[name=edit_contract]').text();
		$(this).parent().next().find('tbody').append('<tr class="appended">'+cloned_row.html()+'</tr>');
		alert_in_edit(`new supplement added for "${employer}"`,'alert-secondary');
	});


	//2. delete new row
	$(document).on('click','button[name=del_supplement_new]', function() {
		var target_table = $(this).parent().next();
		var employer = $(this).parents().eq(3).find('button[name=edit_contract]').text();
		var new_rows = target_table.find("input").length / 2;
		if (new_rows == 0)
		{

		}
		else 
		{
			target_table.find('tbody tr:last').remove();
			alert_in_edit(`new supplement added for "${employer} removed"`,'alert-secondary');

		}
	});

	//add days to the dropdown text button
	$(document).on('click', '.dropdown_add', function() {
		var selected = [];
		var selected_arr = []
		$(this).parent().find('input:checked').each(function() {
			selected.push(' '+$(this).parent().text());
			selected_arr.push($(this).val());
		});
		
		$(this).parents().eq(1).find('input[name=which]').val(selected);
		var button_text = $(this).parent().siblings('button');
		
		if (selected.length == 0)
		{
			button_text.text('Select days');
		}

		else 
		{
			button_text.text(`${selected}`);
		}
		});

	
		$(document).on('click','#save_changes', function() {
		
				$.ajax({
					type: 'POST',
					url: '/contract_changes',
					data: JSON.stringify (json_change),
					contentType: "application/json",
					dataType: 'json'
				})
				
				.done(function(data){ 
					{

						if (data.message == 'success')
						{
							alert_in_edit('changes successful','alert-success');
							window.location.reload();
							localStorage.setItem("ajax", "success");
						}
						else 
						{
							alert_in_edit(`${data.message} in submitting changes`,'alert-warning');
						}
					}
				
					
				});
	
		})

	

		 
 //HIGHCHARTS done!

	$('.btn-close').on('click',function() {
		normalize_modal_contract()
		$('input[name=employer]').val(''); 
		$('select[name=paydate_month_offset]').prop("selectedIndex", 0).val(); 
		$('input[name=base]').val('');
		$('#paymet_rules').hide();
	});


	// event lister for both employer name and paydate offset:

	$(document).on('change', 'select[name=paydate_month_offset]', function() {
		var employer = $('input[name=employer]').val();
		var month_offset = $(this).val();
		if (employer.length > 0 && month_offset >= 0) 

		{
			$('#paymet_rules').show();
		}
		
		else 
		{
			$('#paymet_rules').hide();
			normalize_modal_contract();
			$('input[name=base]').val('');
		}
	});


	$(document).on('keyup', 'input[name=employer]', function() {
		var employer = $(this).val();
		var month_offset = $('select[name=paydate_month_offset]').val();
		if (employer.length > 0 && month_offset >= 0) 

		{
			$('#paymet_rules').show();
		}
		
		else 
		{
			$('#paymet_rules').hide();
			normalize_modal_contract();
			$('input[name=base]').val('');
		}
	});

	//event listener for keying base input, render three items, ready button, checkboxes for adding years and supplements

	$(document).on('keyup', 'input[name=base]', function() {

	
		
		//hide and remove values if input is keyed to zero
		if (!$(this).val())
		{ 	
			normalize_modal_contract()	
		}

		else if ($.isNumeric($(this).val()) == false) 
		{
			normalize_modal_contract()
			$('#message').text('numbers only');
			$('#message').show();	
		}

		else  
		{
			$('#message').hide();
			$('#add_supplement').show();
			$('#add_google_years').show();
			$('#create_contract').show();
		}


	});

	$('#add_supplement').on('change',function()
	{	
		var row_template = $("#cloner tr").clone();
		if ($(this).children().find('input').is(':checked'))
		{	

			$("#supplement_table tbody").html(row_template);
			$("#supplement_table").show();
		}

		else 
		{
			$("#supplement_table").hide();
			$('#supplement_table tbody tr').remove();
		
		}
		
	})


	
	$('#add_google_years').on('change',function()
	{	
		if ($(this).children().find('input').is(':checked'))
		{
			$("#new_contract_years").show();
		}

		else 
		{
			$("#new_contract_years").hide();
			$("#parse_years option:selected").prop("selected", false)
		}
		
	})
	
	//changing the value of the button text when selecting checkboxes for table row
	$(document).on('click', '.dropdown_check', function() {
		var selected = [];
		$(this).parent().find('input:checked').each(function() {
			selected.push($(this).val());
		});
		
		//alert($(this).find('input:checkbox').val());
		var new_val = $(this).text();
		var numberOfChecked = $(this).parent().find('input:checkbox:checked').length;
		var button_text = $(this).parent().siblings('button');
		var hidden_arr = $(this).parent().siblings('input:hidden');
		hidden_arr.val( `[${selected}]`)
		if (numberOfChecked > 1)
		{
			button_text.text(`${numberOfChecked} selected`);
		}
	
		else if (numberOfChecked == 0)
	
		{
			button_text.text('Select days');
		}
	
		else 
		{
			button_text.text(new_val);
			
		}
			
		});

	$(document).on('change', 'select[name=start_times]', function() {
			
		var start =  parseInt($(this).val());
		var start_index = $(this).parent().find(`select option[value=${start}]`).index();
		var end = $(this).parent().next();

		if (start >= parseInt(end.find('select option:selected').val())) 
		{
			end.find('select').prop("selectedIndex", start_index).val(); 
		}
	
		$(end.find('select option')).each(function(index) 
			  
			{ 
			var check_option = $(this);
			if (parseInt(check_option.val())  <= start)
			{
				check_option.prop('disabled',true);
				
			}

			else if (check_option.val() == 'End' || check_option.val() == 'End time')
			{
				check_option.prop('disabled',true);
			}
			else 
			{

				check_option.prop('disabled',false);
			}
				
			});
				
		});
	
	//deleting table row
	$(document).on('click', '#del_row', function() {
		event.preventDefault();
		if ($('#supplement_table tr').length > 2)
		{
			$('#supplement_table tr:last').remove();
		}
	});


	//adding a row
	$('#add_row').on('click',function()
	{	
		event.preventDefault();
		var row_template = $("#cloner tr").clone();
		$("#supplement_table").find('tbody').append('<tr>'+row_template.html()+'</tr>');
	})  

	$('form[name=new_contract]').on('submit', function(event) {
	
		var form = $(this);
		var empty_table_check = [];
		var unique_base_chec = [];
		var num_chec = [];

		$("#supplement_table tbody tr").each(function(){

			var row = $(this);
			unique_base_chec.push(row.find('input[name=rule_name]').val())
			num_chec.push($.isNumeric(row.find('input[name=rate]').val()))
			if (!row.find('input[name=days_arr]').val() || !row.find('input[name=rule_name]').val() || !row.find('input[name=rate]').val() || row.find('select[name=start_times]').val() == 'Start time' ||row.find('select[name=end_times]').val() == 'End time' ) 
			{
				empty_table_check.push(true);
			}
			
		});
		var orig_rules = unique_base_chec.length;
		var unique_rules = $.uniqueSort(unique_base_chec).length;
		
		
		if ($("#add_google_years input:checkbox").is(":checked") && !$("#parse_years option:selected").is(':selected') || $.inArray(true, empty_table_check) == 0 || orig_rules != unique_rules || $.inArray(false, num_chec) == 0) 
		{	
			event.preventDefault();
			$('#message').text('empty values in supplement table, parse years or non unique rule names exist');
			$('#message').show();	
		}

		else 
		{	
			event.preventDefault();
			var employer = $('input[name=employer]').val();
			$('#message').hide();
			$.ajax({
				data : 
				{	
					employer : employer
				},
				type : 'POST',
				url : '/contract_validation'
			})
			.done(function(data)
			{
			
			if (data.error)
			
			{
				
				$('#message').text(data.error);
				$('#message').show();
			}
			else
			{   
				///event.preventDefault();
				form[0].submit();
			}

			})
		}
		
	})

// ajax checking if contract exists , used when contract is available, might change it to seperate modal form
	$(document).on('change', 'select[name=search_parameter]', function() {
		var year_selector = $('select[name=year]');
		var calendar_parser  = $('#calendar_parser');
		var search_parameter = $(this).val();
		$('select[name=year] option').remove();
		year_selector.show();
		calendar_parser.show();
		
		if (search_parameter != 'contract')

		{
		$.ajax({
			data : 
			{	
				search_parameter : search_parameter
			},
			type : 'POST',
			url : '/year_validation/'
		})
		.done(function(data) 
		 {
			var years = JSON.parse(data);

			$.each(years, function(index, value) {
			if (value.inserted == 12)
			{
				year_selector.append($("<option></option>").attr("value", value.year).text(value.year).prop("disabled",true).css("color","green").append("&#10003;").attr('title','complete year'))
			}
			else 
			{
				year_selector.append($("<option></option>").attr("value", value.year).text(value.year).attr('title',`${value.inserted} months parsed for this year`)); 
			}
				
			});
			
			
		 })
		}
		
		else 
		{
			year_selector.hide();
			calendar_parser.hide();
		}

	});




}



function calendar() 
{	

	if(localStorage.getItem("ajax"))
    {
	  $('#load_message').text('values updated');
	  $('#load_message').show();
	   localStorage.clear();
	}

	else if (localStorage.getItem("delete"))
	{
		$('#load_message').text('event deleted');
		$('#load_message').show();
		 localStorage.clear();
	}
	
	function check_times(from_time,to_time,tasks,cal_id)
	{	
		
			var user_times = [];
			var screen_times = [];
			
			for (i = 0; i < to_time - from_time; i++) 
			{	
				user_times.push(from_time + i)
			}
							
			$(tasks).each(function(index,value)
			{ 

			    if (typeof cal_id === 'undefined' || $(value).attr('cal_id') != cal_id)
				{
					var task_start = parseInt($(value).text().split(':')[1].split('-')[0].trim());
					var task_end = parseInt($(value).text().split(':')[1].split('-')[1].trim());
					if (task_end == 0)
					{
						task_end = 24;
					}
					
					var temp_times = []
					for (i = 0; i < task_end - task_start; i++) 
					{	
						temp_times.push(task_start + i)
					}
					screen_times = screen_times.concat(temp_times)	
				}

				else if (cal_id.length > 0 && $(value).attr('cal_id') == cal_id)
				{

				}
				
			});
	
			return user_times.filter(value => screen_times.includes(value));
	};

		
	
	
	
	function modal_alert(message,alert_type)
	{
		$('#modal_message').removeClass();
		$('#modal_message').addClass('alert ' + alert_type);
		$('#modal_message').text(message);
		$('#modal_message').show();
	}

	function send_data_ajax(task)
		{
			 $.ajax({
				data : task,
				type : 'POST',
				url : '/create_task',
				async: false,
				success: function(data) {
					modal_alert(data.response,'alert-success');
				},
				error: function() {
					modal_alert(data.response,'alert-danger');
				}
			})
		}
	
		function create_date(day,time)
		{
			var date = new Date(day);
			date.setHours(time,0,0,0);
			var dd = String(date.getDate()).padStart(2, '0');
			var mm =  String(date.getMonth() + 1).padStart(2, '0');
			var yyyy = String(date.getFullYear());
			var hh = String(date.getHours());
			var fixed_date = `${yyyy}-${mm}-${dd} ${hh}:00`
			return fixed_date
		}

	
	
	//send calendar clicked date to modal form
	$(document).on('click','a[data-bs-target="#todo"]',function(){
		$('.modal-body').find('ul').empty();
		var date = $(this).parent().find('input[name=date]').val();
		var tasks = $(this).parent().find('li');
		
		if (tasks.length > 0)
		{
			$(tasks).each(function(index,value)
			{	var lis = $(value).clone()
				var lis_text = $(value).text();
				lis_text = lis_text.substring(lis_text.indexOf(":"));
				var full = $(value).attr('full');
				lis.text(full+lis_text)
				$('.modal-body').find('ul').append(lis);
				
			})
			$('.modal-title').text(`${date}`)
		}

		else 
		{
			$('.modal-title').text(`${date}`)
			$('#task_form').removeClass('border-top');
			
		}
		$('.modal-body').find('li').contents().wrap("<h5></h5>");
		var now = new Date()
		now.setHours(0,0,0,0)
		form_date = new Date(date)
		form_date.setHours(0,0,0,0)

		if (now.getTime() > form_date.getTime()) 
		{
			$('#new_task').hide()
		}
		else 
		{
			$('#new_task').show()
			$('.modal-body').find('li').css('cursor','pointer')
		}
	});

	//when closed, normalize errthang
	$(document).on('click','button[data-bs-dismiss="modal"]',function(){

			$('#edit_task').click();
			$('.modal-body > ul').empty();
			$('.modal-title').text();
			$('.form_initiated').hide();
			$('select[name=category]').find('option:first').prop('selected',true);
			$('input[name=title]').val('');
			$('input[name=title]').show();
			$('#is_all').prop('checked','true');
			$('select[name=employer]').find('option:first').prop('selected',true);
			$('select[name=employer]').hide();
			$('#fromtime').find('option:first').prop('selected',true);
			$('#totime').find('option:first').prop('selected',true);
			$('#times').hide();
			$('#send_task_div').hide();
			$('#send_task').prop('disabled',true);
			$('.modal-title').text('')
			$('#modal_message').text("");
			$('#modal_message').attr('class','alert');
			$('#modal_message').hide();
			$('#edit_cal_id').val('');
			$('#task_form').addClass('border-top');		
	});

	//show the form when click
	$(document).on('click','#new_task',function(){
		$('.form_initiated').toggle();
		if (!$("#is_all").is(":checked"))
		{
			$('#times').hide();
		}
		
	});


	//render select employer when category is work
	$(document).on('change','select[name=category]',function()
	{
		if($(this).val() == 'work')
		{	
			$('select[name=employer]').show();
			$('input[name=title]').hide();
			$('input[name=title]').val('');
		}

		else if ($(this).val() != 'work')
		{	
			$('select[name=employer]').hide();
			$('select[name=employer]').find('option:first').prop('selected',true);
			$('input[name=title]').show();
		}
	});

	//show the start and end times if checked
	$(document).on('change','#is_all',function()
	{
		if (!$(this).is(":checked"))
		{
			$('#times').show();
		}

		else if ($(this).is(":checked"))
		{
			$('#times').hide();
			$('#fromtime').find('option:first').prop('selected',true);
			$('#totime').find('option:first').prop('selected',true);
		}
	});

	function compare_inputs_to_li(cal_id)
	{
		console.log(cal_id)
		var select_target = $('#modal_full_text').find(`li[cal_id=${String(cal_id)}]`);	
		var lis = select_target.text()
		var title = select_target.attr('full');
		var category = select_target.attr('class')

		if (lis.includes('all day')) 
		{
			var task_time = 'all day'
			if (category == 'work')
			{	
				//if modal has an all day work task, and user switch to fun or errands and checked off boxed: rend button
				if(category != $("select[name=category]").val() && $("input[name=title]").val().length > 0 && $('#is_all').is(':checked'))
				{
					$('#send_edited_task').prop('disabled',false);
				}

				//modal has all day work task bit but employer is different: render button,
				else if ( $("select[name=category]").val() == 'work' && title != $("select[name=employer]").val()) 
				{	
					$('#send_edited_task').prop('disabled',false);
				}

				else if ($("select[name=employer]").val() && $("select[name=category]").val() && $("#fromtime").val() && $("#totime").val())
				{	
					$('#send_edited_task').prop('disabled',false);
				}

				else if ($("select[name=category]").val() && $("input[name=title]").val() && $("#fromtime").val() && $("#totime").val())
				{
					$('#send_edited_task').prop('disabled',false);
				}

				else 
				{
					$('#send_edited_task').prop('disabled',true);
				};
			}

			else if (category != 'work' )
			{

				if ($("select[name=category]").val() && title != $("input[name=title]").val()) 
				{
					$('#send_edited_task').prop('disabled',false);
				}

				else if ($("select[name=category]").val() !=category  && title == $("input[name=title]").val()) 
				{
					$('#send_edited_task').prop('disabled',false);
				}

				else if ($("select[name=category]").val() && $("select[name=employer]").val() && $('#is_all').is(':checked') || $("select[name=category]").val() && $("select[name=employer]").val() && $('#fromtime').val()  && $('#totime').val())
				{
					console.log('asd')
					$('#send_edited_task').prop('disabled',false);
				}

				else if ($("select[name=category]").val() && $('#is_all').is(':checked') && title != $("input[name=title]").val() || $("select[name=category]").val() && $('#fromtime').val()  && $('#totime').val() )
				{
					console.log('asd')
					$('#send_edited_task').prop('disabled',false);
				}

				else 
				{
					console.log('asd')
					$('#send_edited_task').prop('disabled',true);
				};
			}

		}
		
		else if (!lis.includes('all day'))
		{
			var task_time = lis.substring(lis.indexOf(":")).replace(/[^\x00-\x7F]|:|\s/g, "").split('-');
			var start_time = parseInt(task_time[0])
			console.log(lis)
			var end_time =  parseInt(task_time[1].substring(0,2))
			
				if (category != 'work')
				{
					
					if(title != $("input[name=title]").val() || category != $("select[name=category]").val() || start_time != $("#fromtime").val() || end_time != $("#totime").val())
					{
						$('#send_edited_task').prop('disabled',false);
					}
					else 
					{
						$('#send_edited_task').prop('disabled',true);
					};
				}
		
				else if (category == 'work')
				{
		
					if (title != $("select[name=employer]").val() || category != $("select[name=category]").val() || start_time != $("#fromtime").val() || end_time != $("#totime").val())
					{
						$('#send_edited_task').prop('disabled',false);
					}
		
					else 
					{
						$('#send_edited_task').prop('disabled',true);
					};
				}	
		}
		
	};
	
	//deal with time drop downs
	$(document).on('change', '#fromtime', function() {
		var now =  parseInt($(this).val());

		$('.to_time').each(function( )
			{ 	
				target_disable = $(this);
				temp_then = parseInt($(this).val());
				if (temp_then<=now) 
				{	
					target_disable.prop('disabled',true);
				}
				else 
				{
					target_disable.prop('disabled',false);
				}
			});
		});

		

		$(document).on('click','#edit_task',function(){
			$(this).attr('id','new_task').attr('class','btn btn-primary');
			$('#modal_message').text('').hide();
			$('#delete_task').remove();
			$('#new_task').text('Create new task');
			$('#send_edited_task').attr('id','send_task').text('Submit');
			$('select[name=category]').find('option:first').prop('selected',true).change();
			$('input[name=title]').val('').change();
			$('#fromtime').find('option:first').prop('selected',true).change();
			$('#totime').find('option:first').prop('selected',true).change();
			$('#is_all').prop('checked',true).change();
			$('#edit_cal_id').val('');
		});

		//event lister for inputs, enable send button if okay
		$(document).on('change',["select[name=category], select[name=employer], input[name=title], #is_all, #fromtime, #totime"] , function() {

			if ( ($("select[name=category]").val() && $("input[name=title]").val() && $("#is_all").is(":checked")) || ( $("select[name=category]").val()  && $("select[name=employer]").val() && $("#is_all").is(":checked")) )
			{	
				//$('#edit_cal_id').val();
				$('#send_task').prop('disabled',false);	
				if ($('#edit_cal_id').val())
				{	
					var cal_id = $('#edit_cal_id').val();
					compare_inputs_to_li(cal_id);
				};
				
			}
			//if the select options are with times
			else if ( ($("select[name=category]").val() && $("input[name=title]").val()  && $("#fromtime").val() && $("#totime").val() && !$("#is_all").is(":checked")) || ($("select[name=category]").val()  && $("select[name=employer]").val()  && $("#fromtime").val() && $("#totime").val() && !$("#is_all").is(":checked")) )
			{
				//simple for submit form
				$('#send_task').prop('disabled',false);
				
				//not so simple for editing
				if ($('#edit_cal_id').val())
				{	
					var cal_id = $('#edit_cal_id').val();
					compare_inputs_to_li(cal_id);
				
				};
			}

			else 
			{
				$('#send_task').prop('disabled',true);
				$('#send_edited_task').prop('disabled',true);
			}
		});
		


		$(document).on('click','.modal-body h5',function(){

			var filter_finger = $(this).parents().eq(2).find("h5");
			$(filter_finger).each(function(index,value){
				var no_finger = $(value).text().replace(/[^\x00-\x7F]/g, "")
				$(value).text(no_finger);
			})

			var cal_id = $(this).parent().attr('cal_id');
			var lis = $(this).text()
			var task_time = lis.substring(lis.indexOf(":"));
			var title = lis.split(':',1);
			var category = $(this).parent().attr('class');
			$('#new_task').attr('id','edit_task').attr('class','btn btn-warning');
			$('#edit_task').text('Edit Task');
			$('#send_task').attr('id','send_edited_task');
			$('#send_edited_task').text('Save changes').prop("disabled",true);
			$('#edit_cal_id').val(`${cal_id}`)
			modal_alert(`editing task "${title}" under category "${category}" with times${task_time}`,'alert-warning');
			$(this).append('&#9756;');
			if ($("#delete_task").length == 0)
			{
				$('#send_edited_task').after("<button style='margin-left: 50px' type='button' class='btn btn-danger' id='delete_task'>Delete Task</button>")
			}
			
			if (task_time.includes('all day'))
			{
				task_time = 'all day'
				$('select[name=category]').val(category).change();
				if (category == 'work')
				{
					$("select[name=employer]").val(title).change()
					$('#is_all').prop('checked',true).change();
					$('.form_initiated').show();
					
				}

				else if (category != 'work') 
				{
					$("input[name=title]").val(title).change();
					$('#is_all').prop('checked',true).change();
					$('.form_initiated').show();	
				}
			}
			else 
			{
				task_time = task_time.replace(/:|\s/g,'').trim().split('-')
				var start_time = parseInt(task_time[0])
				var end_time =  parseInt(task_time[1].substring(0,2))
				$('select[name=category]').val(category).change();
				if (category == 'work')
				{	
					$("select[name=employer]").val(title).change();
					$('#is_all').prop('checked',false).change()
					$('.form_initiated').show();
					$("#fromtime").val(start_time).change()
					$("#totime").val(end_time).change()
					
				}

				else if (category != 'work') 
				{
					$("input[name=title]").val(title).change();
					$('#is_all').prop('checked',false).change()
					$('.form_initiated').show();
					$("#fromtime").val(start_time).change()
					$("#totime").val(end_time).change()
				}
			}
			//$('#new_task').click()
		});

		$(document).on('click','#delete_task',function() {
			var cal_id = $('#edit_cal_id').val();
			var category = $("select[name=category]").val();
			$.ajax({
				data : 
				{
					cal_id: cal_id,
					category: category
				},
				type : 'POST',
				url : '/delete_task',
				async: false,
				success: function(data) {
					modal_alert(data.response,'alert-success');
					localStorage.setItem("delete", "success");
					window.location.reload();
				},
				error: function() {
					modal_alert(data.response,'alert-danger');
				}
			})
			
		});

		function send_edit_task(update_task)
		{
			 $.ajax({
				data : update_task,
				type : 'POST',
				url : '/edit_task',
				async: false,
				success: function(data) {
					if (data.success)
					{
						modal_alert(data.success,'alert-success')
						localStorage.setItem("ajax", "success");
						window.location.reload();
					}
					else if (data.error)
					{
						modal_alert(data.error,'alert-warning')
						$('#task_form').find('input,select,button').prop('disabled',false);
					}
					
				},
				error: function() {
					$('#send_edited_task').prop('disabled',false)
					modal_alert(data.response,'alert-danger');
				
				}
			})
		}

		function check_edit_object(category,update_task)
		{
			var title = $('input[name=title]').val();
			var employer = $('select[name=employer]').val();
			var cal_id = $('#edit_cal_id').val();
			var prev_val = $('#modal_full_text').find(`li[cal_id=${String(cal_id)}]`).attr('class');
			var last_emp = $('#modal_full_text').find(`li[cal_id=${String(cal_id)}]`).attr('full');
			

			if (title) 
			{
				update_task.title = title;

			}
			
			else if (employer)
			{
				update_task.employer = employer
			} 

			//if the all day event has different categories, delete the last event and insert new
			if (prev_val == 'work' && category != 'work' || prev_val != 'work' && category == 'work')
			{
				update_task.delete_last = cal_id;
				update_task.delete_target = prev_val;
			}

			//also delete last if employers are chosen but are different
			else if (prev_val == 'work' && category == 'work' && employer != last_emp)
			{
				update_task.update_same = cal_id;
			}
			else 
			{
				update_task.update_same = cal_id;
				
			}

			return update_task
		};


		$(document).on('click','#send_edited_task',function() {
			var cal_id = $('#edit_cal_id').val();
			var category =  $("select[name=category]").val();
			var all_day = $("#is_all");
			var tasks = $(this).parents().eq(2).find('li');
			var day = $(this).parentsUntil('.modal-dialog').find('.modal-title').text();
			
			//if the page contains a full day event
			if ($(this).parents().eq(2).find("li:contains('all day')").length == 1)
			{
				
				if (all_day.is(':checked'))
				{
					
					var update_task = {
						category : category,
						whole_day : true,
						day : day
					}

					update_task = check_edit_object(category,update_task);	
				}

				else if (!all_day.is(':checked'))
				{	
					var from_time = parseInt($('#fromtime').val());
					var to_time = parseInt($('#totime').val());

					var update_task = {
						category : category,
						start_time : create_date(day,from_time),
						end_time : create_date(day,to_time)
						
					}

					update_task = check_edit_object(category,update_task);		
				}
				
				$('#task_form').find('input,select,button').prop('disabled',true);
				send_edit_task(update_task);	
			}

			//if the modal form has one or more time elapsed events
			else 
			{	

				if (all_day.is(':checked'))
				{
					if (tasks.length > 1 )

					{
						modal_alert("can't create all day task when other timed tasks exist",'alert-warning');
					}

					else 

					{
						var update_task = {
							category : category,
							whole_day : true,
							day : day
						}
	
						update_task = check_edit_object(category,update_task);
						$('#task_form').find('input,select,button').prop('disabled',true);
						send_edit_task(update_task);

					}
					
				}

				else if (!all_day.is(':checked'))
				{	
					var from_time = parseInt($('#fromtime').val());
					var to_time = parseInt($('#totime').val());


					var is_intersected = check_times(from_time,to_time,tasks,cal_id);
					if (is_intersected.length > 0)
					{
						modal_alert("a task already exists for those times",'alert-warning');
					}


					else 
					{
						var update_task = {
							category : category,
							start_time : create_date(day,from_time),
							end_time : create_date(day,to_time)
							
						}
	
						update_task = check_edit_object(category,update_task);
						$('#task_form').find('input,select,button').prop('disabled',true);
						send_edit_task(update_task);
					}
				}
			
			}
			

		});

		//finally, send the data.
		$(document).on('click','#send_task',function(){
			var category =  $("select[name=category]").val();
			var employer = $('select[name=employer]').val();
			var title = $('input[name=title]').val();
			var all_day = $("#is_all");
			var tasks = $(this).parents().eq(2).find('li');
			var day = $(this).parentsUntil('.modal-dialog').find('.modal-title').text();
			

			if (all_day.is(':checked'))
			{
				if (tasks.length > 0)
				{
					modal_alert("can't create all day task because something already exists",'alert-warning');
					
				}

				else 
				{
					if (employer) 
					{
						var task = {	
							category : category,
							employer : employer,
							whole_day : true,
							day : day
						}
						send_data_ajax(task);
						localStorage.setItem("ajax", "success");
						window.location.reload();

					}
					else if (title)
					{
						var task = {	
							category : category,
							title : title,
							whole_day : true,
							day : day
						};
						send_data_ajax(task);
						localStorage.setItem("ajax", "success");
						window.location.reload();
					}
				}
			}

			else if (!all_day.is(':checked'))
			{	var check_all_day = $(this).parents().eq(2).find("li:contains('all day')");
				if (check_all_day.length > 0)
				{
					modal_alert("a task already exists for those times",'alert-warning');
				}

				else 
				{
					var from_time = parseInt($('#fromtime').val());
					var to_time = parseInt($('#totime').val());
					if (employer) 
					{	
						var is_intersected = check_times(from_time,to_time,tasks);
						
						if (is_intersected.length > 0)
						{
							modal_alert("a task already exists for those times",'alert-warning');
						}
						else 
						{
							
	
							var task = {	
								category : category,
								employer : employer,
								start_time : create_date(day,from_time),
								end_time : create_date(day,to_time)
							}
							send_data_ajax(task);
							localStorage.setItem("ajax", "success");
							window.location.reload();
						}
					}

					else if (title)
				{
					var is_intersected = check_times(from_time,to_time,tasks);
					
					if (is_intersected.length > 0)
					{
						modal_alert("a task already exists for those times",'alert-warning');
					}
					else 
					{	
						var task = 
						{	
							category : category,
							title : title,
							start_time : create_date(day,from_time),
							end_time : create_date(day,to_time)
						};
						send_data_ajax(task);
						localStorage.setItem("ajax", "success");
						window.location.reload();	
					}
				}
				}	
			}

		});


	//main calendar view here
	if ($('a.navbar-brand:nth-of-type(5)').text().includes('guest'))
	{
		$('#calendar').find('a').css('pointer-events','none');
	
	}
	
	;
	$('#calendar').find('a').css('text-decoration','none');
	$('#calendar').find('li.fun').css('color','green');
	$('#calendar').find('li.work').css('color','blue');
	$('#calendar').find('li.errand').css('color','red');


	$(document).ready( function() {
		var today = new Date();
    	var dd = String(today.getDate()).padStart(2, '0');
   		var mm = String(today.getMonth() + 1).padStart(2, '0');
    	var yyyy = today.getFullYear();
		var today =yyyy + '-'+  mm + '-'+  dd;
		
		var todays_tile = $('input[value='+today+']');
		todays_tile.parent().css("background-color","#FFF5DC");
		todays_tile.parent().find('a').css({
			'padding' : '5px',
			'border-radius' : '50%',
			'background-color' : 'white',
		 });
		
		var calendar_focus = $('#calendar_focus').text();
		var calendar_date = new Date(calendar_focus);
		var calendar_date_month = String(calendar_date.getMonth()+1).padStart(2, '0');
		var calendar_date_year= String(calendar_date.getFullYear());
		var comparison_year_mo = calendar_date_year+calendar_date_month

		$('input[name=date').each(function(index) 
		{	hidden_input = $( this );
			if (hidden_input.val().replace(/-/g, "").substring(0,6) !=comparison_year_mo ) 
			{	
				//console.log(  index + ": " + $( this ).val().replace(/-/g, "").substring(0,6) );
				hidden_input.parent().css("background-color","#e6f0ff");
			}
			
		  });
	})

	




}

function check_photo()
{	$('#profile_message').hide();
$('#avatar').attr('title', 'change avatar');
	$('#avatar').on('click',function()
	{
		$('input[type=file]').trigger('click');  
	})

	$('input[type=file]').on('change',function()
	
	{	var form = $(this).parent();
		var alllowed_files = ["image/png","image/jpg","image/jpeg"];
		var file_input = $('input[name=file]').val();
		if (!file_input)
		{	
			$('#profile_message').text('empty field bro!');
			$('#update_success').hide();
			$('#profile_message').show()
		}
		else 
		{	
			files = $('input[name=file]').prop('files');
			for (var i = 0; i < files.length; i++) 
			{
					file = files.item(i);
			}
			if (alllowed_files.includes(file.type))
			
			{
				form[0].submit();
			}

			else 
			{	
				$('#profile_message').text('wrong file type bro');
				$('#update_success').hide();
				$('#profile_message').show();
			}
		}
	})
	
}

function search_check()

{   

	function normalize_modal() 
	{
		$('#myModal').modal('hide');
		setTimeout(function()
		{  	$('#myModal').find('input[name=title]').prop( "disabled", false )
			$('#myModal').find('textarea[name=post]').prop( "disabled", false )
			$('#myModal').find('input[name=thread_id]').remove();
			$('#myModal').find('.btn-group.col-6:nth-of-type(1)').find('button').attr('id','new_post')
			$('#new_post').text('Submit')
			$('#myModal').find('.btn-group.col-6:nth-of-type(2)').find('button').attr('id','cancel_post')
			$('#myModal').find('input:text').show();
			$('#myModal').find('input:text').val('');
			$('#myModal').find('textarea').show();
			$('#myModal').find('textarea').val('');
			$('#myModal').find('.form-group:nth-of-type(1)').find('label').text('title');
			$('#myModal').find('.form-group:nth-of-type(2)').find('label').text('post');
			$('#myModal').find('h4').text('make a post bitch');
			$('#modal_error').hide();
			$('#modal_error').text('');
		}, 1000)
	}
	
	$(function() 
	{
		if ($('#message_success').length == 1)
		{ 	 
			var highlight_target = $('.data_table:nth-of-type(1)')
			setTimeout(function() 
			{
				highlight_target.removeClass("highlight");
		  	}, 2000);
		  	highlight_target.addClass("highlight");
		} 
	});







	$(".dropdown-item[name='delete']").on('click',function(event)
		{	
			$('#myModal').find('input[name=title]').prop( "disabled", true )
			$('#myModal').find('textarea[name=post]').prop( "disabled", true )
			event.preventDefault();
			var thread_id = $(this).parents().eq(5).find('input[name=thread_id]').val();
			var title = $(this).parents().eq(5).find('td:nth-of-type(1)').text();
			var stamp = $(this).parents().eq(5).find('td:nth-of-type(3)').find('p').text();
			var post = $(this).parents().eq(5).find('input[name=post]').val().trim();
			$('#myModal').find('h4').text('are you sure wanna delete this?');
			$('#myModal').find('.form-group:nth-of-type(1)').find('label').text('title: '+title);
			$('#myModal').find('.form-group:nth-of-type(2)').find('label').text('post: '+post);
			$('#myModal').find('.form-group:nth-of-type(2)').find('label').append('<p>created: '+stamp+'</p>')
			$('#myModal').find('input:text').hide();
			$('#myModal').find('textarea').hide();
			$('#new_post').attr("id","delete_post");
			$('#cancel_post').attr("id","cancel_delete");
			$('#myModal').find('form[name=modal]').append('<input type="hidden" value='+thread_id+' name="thread_id">');
			$('#delete_post').text('Delete');
			$('#myModal').modal('show');
		});


	$(document).on('click','#cancel_delete',function(event)
		{ 
			event.preventDefault();
			normalize_modal();
		});


	$(".dropdown-item[name='edit']").on('click',function(event)
		{	
			event.preventDefault();
			var thread_id = $(this).parents().eq(5).find('input[name=thread_id]').val();
			var title = $(this).parents().eq(5).find('td:nth-of-type(1)').text();
			var post = $(this).parents().eq(5).find('input[name=post]').val();
			window.title = title;
			window.post = post;
			$('#myModal').find('h4').text('edit your damn post')
			$('#myModal').find('input:text').val(title);
			$('#myModal').find('textarea').val(post);
			$('#new_post').attr("id","edit_form");
			$('#cancel_post').attr("id","cancel_edit");
			$('#myModal').append('<input type="hidden" value='+thread_id+' name="thread_id">')
			$('#modal_error').hide();
			$('#myModal').modal('show');
		});

	$(document).on('click','#edit_form', function(event) {
		event.preventDefault();
		var edited_title = $('#myModal').find('input:text').val();
		var edited_post = $('#myModal').find('textarea').val();
		var thread_id = $('#myModal').find('input:hidden').val();

		if (window.title ==  edited_title || window.post ==  edited_post)
		{	$('#modal_error').text('');
			$('#modal_error').show();
			$('#modal_error').text('nothing new bro');
		}
		else { 

		$.ajax({
			data : 
			{	
				thread_id : thread_id,
				edited_title : edited_title,
				edited_post : edited_post
			},
			type : 'POST',
			url : '/thread_edit_ajax'
		})

		.done(function()
		{	
			
			$('tbody').find('input[value='+thread_id+']').parents().eq(3).find('td:nth-of-type(1)').html('<strong>'+edited_title+'</strong>');
			
			var highlight_target_target = $('tbody').find('input[value='+thread_id+']').parents().eq(3)

			setTimeout(function() {
				highlight_target_target.removeClass("highlight");
			  }, 2000);
			  highlight_target_target.addClass("highlight");

			normalize_modal();
			$('#query_message').attr('class','alert alert-success')
			$('#query_message').text('post edited!');
			$('#message_success').hide();
			$('#query_message').show();
		})
			}
	});



	$(document).on('click','#cancel_edit', function(event) 
	{
		event.preventDefault();
		normalize_modal();
	});
		
	$('.btn.btn-link.dropdown-toggle').on('click',function() 
	{
		var dropdown_button = $(this);
		var dropdown_menu = dropdown_button.parent().find('ul');
			
		if (dropdown_menu.is(":visible")) 
		{
			$(".dropdown-edit_form").hide();
		}
			
		else 
		{   
			$(".dropdown-edit_form").hide();
			dropdown_menu.toggle();	
		}
	});


$('#show_me').on('click',function() 
{
	$('#myModal').modal('show');
	$('#modal_error').hide();
})


$(document).on('click','#cancel_post',function(event)
	{ 
		event.preventDefault();
		normalize_modal();
		
	});


	$(document).on('click','#new_post', function(event) {
	
		var form = $(this);
		var new_title = $('#myModal').find('input:text').val().trim();
		var new_post = $('#myModal').find('textarea').val().trim();
		
		if (!new_title || !new_post)
			  { event.preventDefault();
				$('#modal_error').text('');
				$('#modal_error').show();
				$('#modal_error').text('fill in the fields bro');
			}
		else 
			{
			 form[0].submit();
			  }
	
	});
	
	$('form[name=search]').on('submit', function(event) 
	{
	event.preventDefault();
	var form = $(this);
	query = $(this).find('input[name=query]').val().trim();
	if (!query ) 
	{ 	$('#query_message').attr('class','alert alert-warning')
		$('#query_message').show();
		$('#query_message').text('empty search field brah');
		$('#message_success').hide();
	}
	else 
	{
		$.ajax({
		data : 
		{
			query : query
		},
		type : 'POST',
		url : '/forum_validation'
	 })
	
	 .done(function(data) 
	 {
		if (data.error) 
		{	$('#query_message').attr('class','alert alert-warning')
			$('#query_message').show();
			$('#query_message').text(data.error);
			$('#message_success').hide();
		}
		else 
		{
			form[0].submit();	
		}
	 });}
	});

}


//login page
function login_page()
{
	$('form').on('submit', function(event) {

	event.preventDefault();
	var form = $(this);
	email_username = $(this).find('input[name ="email_username"]').val().trim();
	password = $(this).find('input[name ="password"]').val().trim();

	if (!email_username || !password) 
	
	{ $('#login_error').show();
	$('#login_error').text('please fill all fields');}
	
	else {$.ajax({
		data : 
		{
			email_username : email_username,
			password : password,
		},
		type : 'POST',
		url : '/user_validation'
	 })
	
	 .done(function(data) 
	 {
		if (data.error) 
		{
			$('#login_error').show();
			$('#login_error').text(data.error);
		}
		else 
		{
			form[0].submit();
		}
	 });}
	});
}

//create profile
function create_profile()

{

	function isEmail(email) {
		var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
		return regex.test(email);
	  }


	$('form').on('submit', function(event) 
	
	{
		event.preventDefault();
		var form = $(this);
		var username = $('input[name=username]').val().trim();
		var email = $('input[name=email]').val().trim();
		var home_town = $('input[name=home_town]').val().trim();
		var password = $('input[name=password]').val().trim();
		var password_confirm = $('input[name=password_confirm]').val().trim();
		
		if ( !username || !email || !home_town ||  !password || !password_confirm)
				
		{
			$('#create_error').show();	
			$('#create_error').text('fill all fields');
		}

		else if ( username.length < 5)
		{

			$('#create_error').show();	
			$('#create_error').text('username needs to be at least 5 letters');
		}
	
		else if ( !isEmail(email))
		{

			$('#create_error').show();	
			$('#create_error').text('email not valid');
		}

		else if ( password != password_confirm)
		{

			$('#create_error').show();	
			$('#create_error').text("password doesn't match");
		}


		else 
		{
			$.ajax({
			data : 
			{
				username : username,
				email : email,
			},
			type : 'POST',
			url : '/profile_validation'
		 })
		
		 .done(function(data) 
		 {
			if (data.error) 
			{
				$('#create_error').show();
				$('#create_error').text(data.error);
			}
			else 
			{
				$("#create_error").attr('class', 'alert alert-success');
				$('#create_error').show();
				$('#create_error').text(data.success);
				form[0].submit();
			}
		 });}
		
		
	});


}
