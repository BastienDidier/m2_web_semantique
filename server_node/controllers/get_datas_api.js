// Node Modules


// NPM Modules
var async 			= require("async");
var unirest 		= require("unirest");
var request 		= require("request");

// Init


// Variables


module.exports = function (req, res)
{
	async.waterfall([

		function(wcb)
		{
			var wdatas = {
				name_movie: "inception"
			};

			return wcb(null, wdatas);
		},

		get_id_imdb,
		get_datas_per_id,


	], function(err, result){

		if (err || !result)
		{
			console.log(err);
			console.log("[controllers][get_datas_api]"+err);

			return res.status(500).json({
				err: true
			});
		}
		else
		{
			
			return res.status(200).json({
				data : result.datas
			});
		}

	});
};


var get_id_imdb = function(wdatas, wcb)
{

	var options = {
	  method: 'GET',
	  url: 'https://imdb-internet-movie-database-unofficial.p.rapidapi.com/search/inception',
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

		wdatas.id = JSON.parse(body).titles[0].id;
		return wcb(null, wdatas)
	});
}


var get_datas_per_id = function(wdatas, wcb)
{

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
		wdatas.datas = JSON.parse(body)
		return wcb(null, wdatas)
	});
}

