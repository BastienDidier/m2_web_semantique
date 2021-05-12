var async=require('async');
var request=require('request');
var papa = require("papaparse").papa ;
const csvtojson=require('csvtojson')
var fs = require("fs");

module.exports = function (req, res, next) {

console.log("begin")
async.waterfall([

        function (wcb) {
            var wdatas= {

            	csv_file : "../data/Paris-Propre.csv"

            	};

            return wcb(null,wdatas);
        },

        parse_json,
        each_row,
        build_new_file,

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][transform_datas]"+error)
            
			return res.status(500).json({
				err: true
			});

        }else{
        	console.log("end")
        	return res.status(200).json({
				result : "ok"
			});
		}

    });
};


var  parse_json = function(wdatas, wcb)
{
	console.log("parse_json")
	var csv_file = wdatas.csv_file;
	csvtojson({delimiter : ";"})
	.fromFile(csv_file)
	.then((jsonObj)=>{

		if( ! jsonObj)
		{
			console.log("err no jsonObj");
			return wcb("[parse_json] no jsonObj ", wdatas);
		}
		else
		{
			wdatas.json_datas = jsonObj;
			console.log(jsonObj[0]);
			return wcb(null, wdatas);
		}
	})
}

var each_row = function(wdatas, wcb)
{
	console.log("each_row")
	var json_datas = wdatas.json_datas;
	var formated_json_datas = [];

	if(json_datas.length > 10)
	{
		async.eachLimit(json_datas, 10, function(row, cb)
		{
		    waterfall_row(row, function(err, result)
		    {
		    	if(err)
		    	{
		    		console.log(err);
		    		return cb(err, null);
		    	}
		    	else
		    	{
		    		formated_json_datas.push(result.data);
		    		return cb(null, result.data);
		    	}
		    });
		},
		function(err, result)
		{
			if(err)
			{
		    	console.log(err);
		    	return wcb("[each_row]"+err, wdatas);
			}
			else
			{
				wdatas.json_datas = formated_json_datas;
				return wcb(null, wdatas);
			}

		});
	}
	else
	{
		return wcb("[each_row] not enough datas", wdatas);
	}

}



var waterfall_row = function(datas, callback)
{
	console.log("waterfall_row")
	async.waterfall([
	
	        function (wcb) {
				var wdatas = {
					row: datas
				}
	            return wcb(null, wdatas);
	        },
	
	        get_id_imdb,
	        call_api,
	
	    ],
	    function(error,result){
	
	        if(error || !result){
	
	           return callback("[waterfall_row]"+error, );
	
	        }else{
				
				return callback(null, result)
	        }
	    });
}



var get_id_imdb = function(wdatas, wcb)
{
	console.log("get_id_imdb")
	var title = wdatas.row["nom_tournage"];

	var options = {
	  method: 'GET',
	  url: 'https://imdb-internet-movie-database-unofficial.p.rapidapi.com/search/'+ title,
	  headers: {
	    'x-rapidapi-key': 'e0eef40ad3msh4f83c165a19caeap110cfejsn8f8f6380724c',
	    'x-rapidapi-host': 'imdb-internet-movie-database-unofficial.p.rapidapi.com'
	  }
	};

	request(options, function (error, response, body) {
		if (error) {
			console.log(error)
			return wcb("[get_id_imdb]", wdatas);
		}
		else
		{
			wdatas.id = JSON.parse(body).titles[0].id;
			return wcb(null, wdatas)
		}

	});
}

var call_api = function(wdatas, wcb)
{
	console.log("call_api")
	var row = wdatas.row;
	var api_key = "3f9452cb";
	var id = wdatas.id;
	var url = "http://www.omdbapi.com/?apikey=" + api_key + "&i=" + id.toString()
	var options = {
	  method: 'GET',
	  url: url,
	  headers: {
	  }
	};

	request(options, function (error, response, body) {
		if (error) {
			console.log(error)
			return wcb("[get_datas_per_id]", wdatas);
		}
		var datas = JSON.parse(body)

		row["actors"] = datas["Actors"];
		row["runtime"] = datas["runtime"];
		row["Genre"] = datas["Genre"];
		row["Metascore"] = datas["Metascore"];
		row["Released"] = datas["Released"];

		wdatas.datas = row;
		return wcb(null, wdatas)
	});
	
}


var build_new_file = function(wdatas, wcb)
{
	console.log("build_new_file")
	var datas = wdatas.datas;
	var csv = Papa.unparse(datas, {
		quotes: false, //or array of booleans
		quoteChar: '"',
		escapeChar: '"',
		delimiter: ";",
		header: true,
		newline: "\r\n",
		skipEmptyLines: false, //other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
		columns: null //or array of strings
	});

	fs.writeFile("transformed_datas.csv", csv, function(err, result)
	{
	  if (err)
	    console.log(err);
	  else {
	    return wcb(null, wdatas);
	  }

	})
}