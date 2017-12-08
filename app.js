// npm install express --save
// npm install gdax --save
// npm install --save discord.js
// npm install properties-reader --save

const fs = require('fs');
const express = require('express');
const Gdax = require('gdax');
var PropertiesReader = require('properties-reader');
var propsDir = process.argv.length == 2? 'application.properties' :  process.argv[2];
const request = require('request');


var properties = PropertiesReader(propsDir);

const authenticatedClient = new Gdax.AuthenticatedClient(
	properties.get('gdax.key'),
	properties.get('gdax.secret'),
	properties.get('gdax.passphrase'),
	'https://api.gdax.com'
);



function saveDB(db){
	fs.writeFile('data.json', JSON.stringify(db));
}

function loadDB(){
	if (fs.existsSync('data.json')) {
		return JSON.parse(fs.readFileSync('data.json'));
	}
	return [];
}

function getOrder(orders,id){
	for(var i in orders){
		var order = orders[i];
		if(order.trade_id === id){
			return order;
		}
	}
	return null;
}

function sendMessage(text){
	
	request.post(properties.get('discord.webhook'), {
		form: {
		 	content:text
		}
	});	
}

function collector(){

	authenticatedClient.getFills(
		{},
		(error, response, orders) => {
  		if (!error && response.statusCode == 200) {
				console.log('getFills',new Date());
				var database = loadDB();
				if(database.length == 0){
					database = orders;
					saveDB(database);
				}
				
				var fills = [];

				var hasNew = false;
				for(var i in orders){
					var oid = orders[i].trade_id;
					var curr = getOrder(orders,oid);						
					var prev = getOrder(database,oid);
				
					if(prev == null) {
						hasNew = true;
						var message=fill.side +' '+ fill.product_id+' at price='+fill.price +', size='+fill.size +'\n';
						sendMessage(message);
					}
				}

				if(hasNew){
					saveDB(orders);
				}
			}else{
				console.log('error',new Date());
			}
		}
	);
	setTimeout(collector, 30000);
}

  collector();



