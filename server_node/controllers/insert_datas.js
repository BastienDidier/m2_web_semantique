var async=require('async');
var request=require('request');
const csvtojson=require('csvtojson')
var fs = require("fs");

module.exports = function (req, res, next) {


	async.waterfall([

        function (wcb) {
            var wdatas= {

            		csv_file : "transformeds_datas.csv",
            		list_films: {},
            		url_fuseki_update: "http://localhost:3030/cinemaTP/update"

            	};

            return wcb(null,wdatas);
        },

        parse_json,
        get_real,
        get_genre,
        get_actors,
        get_lieu,
        call_dbpedia,
        get_films,
        build_query_film,
        query_db,
        build_query_file

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

var get_real = function(wdatas, wcb)
{
	var json_datas = wdatas.json_datas;
	var tab_real = [];
	var json_films = wdatas.json_films;

	json_datas.map(function(elt)
	{

		var film_name = elt["nom_tournage"];
		var real = elt["nom_realisateur"].toLowerCase().trim()
		real = cleanUpSpecialChars(real);


		if(real.indexOf(" - ") != -1)
		{
			var tab_reals = real.split(" - ");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real.push(tab_reals[i].toLowerCase().trim());

				}

			}

		}
		else if( real.indexOf(", ") != -1 )
		{
			var tab_reals = real.split(", ");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real.push(tab_reals[i].toLowerCase().trim());

				}

			}

		}
		else if(real.indexOf(" et ") != -1)
		{
			var tab_reals = real.split(" et ");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real.push(tab_reals[i].toLowerCase().trim());

				}

			}
		}
		else if(real.indexOf("/") != -1)
		{
			var tab_reals = real.split("/");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real.push(tab_reals[i].toLowerCase().trim());

				}

			}
		}
		else
		{
			if(tab_real.indexOf(real) == -1)
			{
				tab_real.push(real);

			}
		}

	})



	var query_real = build_prefix()
	for(var i = 0; i<tab_real.length; i++)
	{

		query_real += insert_realisateur(tab_real[i], i);

	}

	query_real += "\n"
	wdatas.query = query_real;
	wdatas.tab_real = tab_real;
	return wcb(null, wdatas);


}


var get_actors = function(wdatas, wcb)
{
	var json_datas = wdatas.json_datas;
	var query = wdatas.query;
	
	var tab_actors = []

	json_datas.map(function(elt)
	{
		var actors = elt["actors"].split(",");
		for(var j = 0; j<actors.length; j++)
		{
			var actor = actors[j].toLowerCase().trim();
			actor = cleanUpSpecialChars(actor);

			if(tab_actors.indexOf(actor) == -1)
			{
				tab_actors.push(actor);
			}			
		}
	})


	for(var i = 0; i<tab_actors.length; i++)
	{
		query += insert_acteur(tab_actors[i], i);
	}

	query += "\n"
	wdatas.query = query;
	wdatas.tab_actors = tab_actors;

	return wcb(null, wdatas);


}


var get_genre = function(wdatas, wcb)
{
	var json_datas = wdatas.json_datas;
	var query = wdatas.query;

	var tab_genre = []

	json_datas.map(function(elt)
	{
		var genres = elt["Genre"].split(",");
		for(var j = 0; j<genres.length; j++)
		{
			var genre = genres[j].toLowerCase().trim();
			genre = cleanUpSpecialChars(genre);

			if(genre == "" || genre == "n/a")
			{
				genre = "n/a";
			}

			if(genre == "musical")
			{
				genre = "music";
			}

			if(tab_genre.indexOf(genre) == -1)
			{
				tab_genre.push(genre);
			}			
		}
	})


	for(var i = 0; i<tab_genre.length; i++)
	{
		query += insert_genre(tab_genre[i], i);
	}

	query += "\n"
	wdatas.query = query;
	wdatas.tab_genre = tab_genre;
	return wcb(null, wdatas);
}


var get_lieu = function(wdatas, wcb)
{
	var json_datas = wdatas.json_datas;
	var query = wdatas.query;
	var lieux = {

		"Europe": {
			"France": {}
		}

	};

	var France = lieux["Europe"]["France"];
	var tab_adresse = [];
	json_datas.map(function(elt)
	{

		var lieu = elt["adresse_lieu"];
		var adresse = lieu.split(",")[0]
		var tab_adresse_row = adresse.split("/");
		var quartier = "";
		var ville = "";

		if(lieu.split(",").length == 1)
		{
			quartier = "nsp";
			ville = "paris"
		}
		else
		{
			quartier = lieu.split(",")[1].trim().split(" ")[0];
			ville = lieu.split(",")[1].trim().split(" ")[1]
		}

		ville = ville[0].toUpperCase() + ville.slice(1)

		ville = cleanUpSpecialChars(ville);
		quartier = cleanUpSpecialChars(quartier);

		

		if( ! France[ville])
		{
			France[ville] = {};
		}
		
		if(! France[ville][quartier])
		{
			France[ville][quartier] = [];
		}

		for(var i = 0; i<tab_adresse_row.length; i++)
		{
			if(France[ville][quartier].indexOf(tab_adresse_row[i]) == -1)
			{
				France[ville][quartier].push(cleanUpSpecialChars(tab_adresse_row[i].toLowerCase().trim()));
			}
		}
		
	})

	var index_continent = 0;
	var index_pays = 0;
	var index_ville = 0;
	var index_quartier = 0;
	var index_adresse = 0;

	var list_villes = []

	for (var continent in lieux)
	{

	  query += ":continent"+index_continent + " rdfs:label \"" + continent + "\".\n" ;
	  query += ":continent"+index_continent+" a :continent .\n";

	  for(var pays in lieux[continent])
	  {
	  	query += ":pays"+index_pays + " rdfs:label \"" + pays + "\".\n" ;
	  	query += ":pays"+index_pays+" a :pays .\n";
	  	query += ":pays"+index_pays + " :seSitueDans :continent"+index_continent +". \n";

	  	for(var ville in lieux[continent][pays])
	  	{
	  		list_villes.push(ville);
	  		query += ":ville"+index_ville +  " rdfs:label \"" + ville + "\".\n" ;
	  		query += ":ville"+index_ville+" a :ville .\n";
	  		query += ":ville"+index_pays + " :seSitueDans :pays"+index_pays +". \n";
	  		
	  		for(var quartier in lieux[continent][pays][ville])
  			{
  				query += ":quartier"+index_quartier +  " rdfs:label \"" + quartier + "\".\n" ;
  				query += ":quartier"+index_quartier+" a :quartier .\n";
  				query += ":quartier"+index_quartier + " :seSitueDans :ville"+index_ville +". \n";
  				
  				for(var i = 0; i< lieux[continent][pays][ville][quartier].length; i++ )
  				{
  					query += ":adresse"+index_adresse +  " rdfs:label \"" + lieux[continent][pays][ville][quartier][i] + "\".\n" ;
  					query += ":adresse"+index_adresse+" a :adresse .\n";
  					query += ":adresse"+index_adresse + " :seSitueDans :quartier"+index_quartier +". \n";
  					tab_adresse.push(lieux[continent][pays][ville][quartier][i]);
  					index_adresse += 1
  				}

  				index_quartier += 1
  			}

	  		index_ville += 1;
	  	}

	  	index_pays += 1;
	  }

	  index_continent += 1;

	}

	query += "\n"
	wdatas.query = query;
	wdatas.tab_adresse = tab_adresse;
	wdatas.list_villes = list_villes

	return wcb(null, wdatas);
}


var call_dbpedia = function(wdatas, wcb)
{
	var list_villes = wdatas.list_villes;
	console.log("iic list_villes call_dbpedia")
	console.log(list_villes)
	var url_fuseki = "http://localhost:3030/cinemaTP";
	var query = wdatas.query;
	var index_ville = 0;
	async.eachLimit(list_villes , 1, function(ville, cb)
	{
		var query_dbpedia = 'PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#>\n'
		query_dbpedia += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
		query_dbpedia += "SELECT * WHERE { \n";
		query_dbpedia += "SERVICE <http://dbpedia.org/sparql> {\n";
		query_dbpedia += "<http://dbpedia.org/resource/"+ville+"> ?o ?p .\n"
		query_dbpedia += "}\n"
		query_dbpedia += "}\n"

		var data = {query: query_dbpedia};

		request.post({

		    url: url_fuseki,
		    json: true,
		    form: data

		}, function(err, response, body){

		    if(err || !response || response.statusCode != 200)
		    {
		        console.log(err);   
		        index_ville += 1;
		        return cb( null , null);
		    }
		    else
		    {
		        var data = body.results.bindings;
		        for(var i = 0; i<data.length; i++)
		        {

		        	var ontology = data[i]["o"]["value"];
		        	var property = data[i]["p"];
		        	if(ontology.indexOf("abstract") != -1 && property["xml:lang"] == "fr" )
		        	{
		        		query += ":ville"+index_ville + " :description \""+ property["value"] +"\" .\n";
		        	}
		        }

		        index_ville += 1;
		        return cb(null, null);
		    }
		});
	    
	},
	function(err, result)
	{
		if(err)
		{
	    	console.log(err);
	    	return wcb("[call_dbpedia]"+err, wdatas);
		}
		else
		{
			wdatas.query = query;
			return wcb(null, wdatas);
		}

	});


}

var get_films = function(wdatas, wcb)
{
	var json_datas = wdatas.json_datas;
	
	var tab_real = wdatas.tab_real;
	var tab_actors = wdatas.tab_actors;
	var tab_genre = wdatas.tab_genre;
	var tab_adresse = wdatas.tab_adresse;


	var list_films = {};
	json_datas.map(function(elt)
	{
		var tab_actors_row = [];
		var tab_real_row = [];
		var tab_genre_row = []

		var actors = elt["actors"].split(",");
		for(var j = 0; j<actors.length; j++)
		{
			var actor = actors[j].toLowerCase().trim();
			actor = cleanUpSpecialChars(actor);

			if(tab_actors_row.indexOf(actor) == -1)
			{
				tab_actors_row.push(actor);
			}			
		}

		var real = elt["nom_realisateur"].toLowerCase().trim()
		real = cleanUpSpecialChars(real);



		if(real.indexOf(" - ") != -1)
		{
			var tab_reals = real.split(" - ");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real_row.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real_row.push(tab_reals[i].toLowerCase().trim());

				}

			}

		}
		else if( real.indexOf(", ") != -1 )
		{
			var tab_reals = real.split(", ");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real_row.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real_row.push(tab_reals[i].toLowerCase().trim());

				}

			}

		}
		else if(real.indexOf(" et ") != -1)
		{
			var tab_reals = real.split(" et ");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real_row.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real_row.push(tab_reals[i].toLowerCase().trim());

				}

			}
		}
		else if(real.indexOf("/") != -1)
		{
			var tab_reals = real.split("/");
			for(var i = 0; i<tab_reals.length; i++)
			{
				if(tab_real_row.indexOf(tab_reals[i].toLowerCase().trim()) == -1)
				{
					tab_real_row.push(tab_reals[i].toLowerCase().trim());

				}

			}
		}
		else
		{
			if(tab_real_row.indexOf(real) == -1)
			{
				tab_real_row.push(real);

			}
		}


		var genres = elt["Genre"].split(",");
		for(var j = 0; j<genres.length; j++)
		{
			var genre = genres[j].toLowerCase().trim();
			genre = cleanUpSpecialChars(genre);
			if(genre == "" || genre == "n/a")
			{
				genre = "n/a";
			}
			if(genre == "musical")
			{
				genre = "music";
			}
			if(tab_genre_row.indexOf(genre) == -1)
			{
				tab_genre_row.push(genre);
			}			
		}

		var lieu = elt["adresse_lieu"];
		var adresse = lieu.split(",")[0]
		var tab_adresse_row = adresse.split("/");


		if(! list_films[elt["nom_tournage"]])
		{
			var tpm_film = {

				nom_film: 		elt["nom_tournage"],
				types: 			elt["type_tournage"],
				realisateur: 	get_correspondant_index(tab_real_row, tab_real, "realisateur"),
				actors: 		get_correspondant_index(tab_actors_row, tab_actors, "acteur"),
				genres: 		get_correspondant_index(tab_genre_row, tab_genre, "genre"),
				duree: 			elt["runtime"].replace(" min", ""),
				lieu_tournage: 	get_correspondant_index(tab_adresse_row, tab_adresse, "adresse"),
				ratings: 		elt["Rating"],
				nb_ratings: 	elt["nb_votes"],
				annee_tournage: elt["annee_tournage"]

			}

			list_films[elt["nom_tournage"]] = tpm_film;
		}
		else
		{
			list_films[elt["nom_tournage"]]["lieu_tournage"] = list_films[elt["nom_tournage"]]["lieu_tournage"].concat(get_correspondant_index(tab_adresse_row, tab_adresse, "adresse")); 
		}
	})


	wdatas.list_films = list_films;

	return wcb(null, wdatas)

}


var build_query_film = function(wdatas, wcb)
{
	var list_films = wdatas.list_films;
	var query = wdatas.query;

	var index_film = 0;
	var index_serie = 0;

	for (var film in list_films)
	{

		var type = list_films[film]["types"].indexOf("Série") != -1 ? "serie" : "film"
		query += ":video"+index_film  + " rdfs:label \"" + film + "\".\n" ;
	  	query += ":video"+index_film+" a :"+type+" .\n";

	  	for(var i = 0; i<list_films[film]["lieu_tournage"].length; i++)
	  	{
	  		query += ":video"+index_film+" :aEteRealiseA :"+list_films[film]["lieu_tournage"][i]+" .\n";
	  	}

	  	for(var i = 0; i<list_films[film]["actors"].length; i++)
	  	{
	  		query += ":video"+index_film+" :aPourActeur :"+list_films[film]["actors"][i]+" .\n";
	  	}

	  	for(var i = 0; i<list_films[film]["genres"].length; i++)
	  	{
	  		query += ":video"+index_film+" :aPourGenre :"+list_films[film]["genres"][i]+" .\n";
	  	}

	  	for(var i = 0; i<list_films[film]["realisateur"].length; i++)
	  	{
	  		query += ":video"+index_film+" :aPourRealisateur :"+list_films[film]["realisateur"][i]+" .\n";
	  	}

	  	var duree = list_films[film]["duree"]
	  	if( ! duree || duree == "N/A" || duree == "")
	  	{
	  		duree = 0
	  	}

	  	query += ":video"+index_film+" :aPourDuree :"+duree+" .\n";

	  	var nb_votes = list_films[film]["nb_ratings"];
	  	if(! nb_votes || nb_votes == "N/A" || nb_votes == "")
	  	{
	  		nb_votes = 0;
	  	}

	  	var notes = list_films[film]["ratings"];
	  	if(! notes || notes == "N/A" || notes == "")
	  	{
	  		notes = 5;
	  	}

	  	query += ":video"+index_film+" :aPourNote "+notes+" .\n";
	  	query += ":video"+index_film+" :a_un_nombre_de_vote "+nb_votes+" .\n";
	  	query += ":video"+index_film+" :estSortiEn :"+list_films[film]["annee_tournage"]+" .\n";

		index_film += 1;
		
	}

	wdatas.query = query;
	return wcb(null, wdatas);

}

var query_db = function(wdatas, wcb)
{
	var query = wdatas.query + "\n}\n";
	var url_fuseki_update = wdatas.url_fuseki_update
	var data = {update: query};

	request.post({

	    url: url_fuseki_update,
	    json: true,
	    form: data

	}, function(err, response, body){

	    if(err || !response || response.statusCode != 200)
	    {
	        console.log(err);
	        console.log("Erreur");    
			return wcb("[query_db]"+err, wdatas);
	    }
	    else
	    {
			return wcb(null, wdatas);
	    }
	});
}


function get_correspondant_index(tab1, tab2, type)
{
	var array_indexes = [];
	for(var i = 0; i<tab1.length; i++)
	{
		for(var j = 0; j<tab2.length; j++)
		{
			if(tab1[i] == tab2[j])
			{
				array_indexes.push(type+""+j);
			}
		}
	}

	return array_indexes;

}
function build_prefix()
{

	var str =  "PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#>\n";
	str += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n"
	str += "INSERT DATA {\n"


	return str

}


function insert_realisateur(nom_real, index)
{
	var str = " :realisateur"+index+" rdfs:label \""+nom_real+"\".\n"
	str += ":realisateur"+index+" a :realisateur .\n"
	return str;
}

function insert_genre(nom_genre, index)
{
	var str = " :genre"+index+" rdfs:label \""+nom_genre+"\".\n"
	str += ":genre"+index+" a :genre .\n"
	return str;
}

function insert_acteur(acteur_name, index)
{
	var str = " :acteur"+index+" rdfs:label \""+acteur_name+"\".\n"
	str += ":acteur"+index+" a :acteur .\n"
	return str;
}


var build_query_file = function(wdatas, wcb)
{
	var query_str = wdatas.query;
	query_str += "\n}\n";

	fs.writeFile("query_str.txt", query_str, function(err, result)
	{
	  if (err)
	    console.log(err);
	  else {
	    return wcb(null, wdatas);
	  }

	})

}


function cleanUpSpecialChars(str)
{
    return str
        .replace(/[ÀÁÂÃÄÅ]/g,"A")
        .replace(/[àáâãäå]/g,"a")
        .replace(/[ÈÉÊË]/g,"E")
        .replace(/[èé]/g,"e")
}