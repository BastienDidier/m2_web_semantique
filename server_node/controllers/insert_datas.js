var async=require('async');
var request=require('request');
const csvtojson=require('csvtojson')

module.exports = function (req, res, next) {


async.waterfall([

        function (wcb) {
            var wdatas= {

            		csv_file : "csv_file : "../data/Paris-Propre.csv""

            	};

            return wcb(null,wdatas);
        },

        parse_json,

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

	return "";

}

function insert_movie(row)
{
	return "";
}

function insert_realisateur(row)
{
	return "";
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