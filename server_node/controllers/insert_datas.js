var async=require('async');
var request=require('request');
const csvtojson=require('csvtojson')
var fs = require("fs");

module.exports = function (req, res, next) {


	async.waterfall([

        function (wcb) {
            var wdatas= {

            		csv_file : "transformeds_datas.csv"

            	};

            return wcb(null,wdatas);
        },

        clear_file,
        parse_json,
        get_real,
        build_query_file,

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][insert_datas]"+error)
            return res.status(500).json({
				err: true
			});

        }else{

        	return res.status(200).json({
				result : "ok"
			});

        }

    });
};


var clear_file = function(wdatas, wcb)
{
	var file_name = "query_str.txt";

	fs.unlink(file_name, function(err, result)
	{
		if(err)
		{
			return wcb("[clear_file]"+err, wdatas);
		}
		else
		{
			return wcb(null, wdatas);
		}
	});

}


var  parse_json = function(wdatas, wcb)
{
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
			return wcb(null, wdatas);
		}
	})
}

var get_real = function(wdatas, wcb)
{
	var json_datas = wdatas.json_datas;
	var tab_real = []
	json_datas.map(function(elt)
	{
		var real = elt["nom_realisateur"]
		if(tab_real.indexOf(real) == -1)
		{
			tab_real.push(real);

		}
	})

	var query_real = build_prefix()
	for(var i = 0; i<tab_real.length; i++)
	{

		query_real += insert_realisateur(tab_real[i], i);

	}

	query_real += "\n}\n"
	wdatas.query_real = query_real;

	return wcb(null, wdatas);


}

var each_row = function(wdatas, wcb)
{

	var json_datas = wdatas.json_datas;

	async.eachLimit(json_datas, 1, function(row, cb)
		{
		    waterfall_insert_row(row, function(err, result)
		    {
		    	if(err)
		    	{
		    		console.log(err);
		    		return cb(null, null);
		    	}
		    	else
		    	{
		    		return cb(null, result);
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
			return wcb(null, wdatas);
		}

	});
}



var waterfall_insert_row = function(datas, cb)
{
	async.waterfall([
	
	        function (wcb) {
				var wdatas = {
					row: datas
				}
	            return wcb(null, wdatas);
	        },

			build_insert_str,
			insert_row
    ],
    function(error,result){

        if(error || !result){

           return cb("[waterfall_insert_row]"+error, );

        }else{
			return cb(null, result)
        }
    });

}


var build_insert_str = function(wdatas, wcb)
{
	var row = wdatas.row;
	var query = build_prefix();
	query += insert_movie(row);
	query += insert_actors(row);
	query += insert_realisateur(row);
	query += insert_lieu(row);

	console.log(query);
	wdatas.query = query
	return wcb(null, wdatas);
}


var db_insert = function(wdatas, wcb)
{
	var query = wdatas.query;
	//to do find npm module for insert datas
	return wcb(null, wdatas)
}



function build_prefix()
{

	var str =  "PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161>\n";
	str += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
	str += "INSERT DATA {\n"


	return str

}

function insert_movie(row)
{

	return "";
}

function insert_realisateur(nom_real, index)
{
	var str = " :realisateur"+index+" rdfs:label \""+nom_real+"\".\n"
	return str;
}

function insert_genre(row)
{
	return "";

}

function insert_lieu(row)
{
	return "";
}

function insert_actors(row)
{
	var str = ""
	var actors = row["actors"].split(",");
	for(var i = 0; i<actors.length; i++)
	{
		str += insert_acteur(actors[i], row["nom_tournage"]);
	}

	return str;
}

function insert_acteur(acteur_name, film_name)
{
	return "";
}


var build_query_file = function(wdatas, wcb)
{
	var query_str = wdatas.query_real;

	fs.writeFile("query_str.txt", query_str, function(err, result)
	{
	  if (err)
	    console.log(err);
	  else {
	    return wcb(null, wdatas);
	  }

	})

}