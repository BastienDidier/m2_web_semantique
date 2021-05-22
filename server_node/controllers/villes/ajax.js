var async=require('async');
var request=require('request');

module.exports = function (req, res, next) {

    async.waterfall([

        function (wcb) {
            var wdatas= {

                ville_id: req.params.id,
                url_fuseki_update: "http://localhost:3030/cinemaTP",
                genre: req.query.genre || "all",
                token_mapbox: "pk.eyJ1Ijoic2tyYWxsa2FnZ2VuIiwiYSI6ImNrb3pqMzRuMjBreWoyd254YjdyMmJ6ZG8ifQ.Z0Efmarj4fYhEhA4fYSl-w"

            };

            return wcb(null,wdatas);
        },

        call_db,
        format_list_film,
        format_list_adresse,
        get_geocoding_values,
        get_directions

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][villes][ajax]"+error)
            return res.status(500).json({error: true});

        }else{

            return res.status(200).json({list_film: result.list_film, description_ville: result.description_ville, directions: result.directions});

        }

    });
};


var call_db = function(wdatas, wcb)
{
    var ville_id = wdatas.ville_id;

     var url_fuseki_update = wdatas.url_fuseki_update;
    var query = 'PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#>'
    query += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    query += "SELECT ?nom_video  ?adresse ?ville ?note ?ville_description WHERE {"
    query += "?video a :film ."
    query += "?video rdfs:label ?nom_video ."
    query += "?video :aPourNote ?note ."
    query += "?video :aEteRealiseA ?adresse_uri ."
    query += "?adresse_uri rdfs:label ?adresse ."
    query += "?adresse_uri :seSitueDans ?quartier_uri ."
    query += "?quartier_uri :seSitueDans ?ville_uri ."
    query += "?ville_uri rdfs:label ?ville ."
    query += "?ville_uri :description ?ville_description ."
    query += "FILTER(str(?ville_uri) = 'http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#"+ville_id+"')";
    query += "}"

    var data = {query: query};

    request.post({

        url: url_fuseki_update,
        json: true,
        form: data

    }, function(err, response, body){

        if(err || !response || response.statusCode != 200)
        {
            console.log(err);   
            return wcb("[query_db]"+err, wdatas);
        }
        else
        {
            var list_film = body.results.bindings;
            wdatas.list_film = list_film; 
            return wcb(null, wdatas);
        }
    });
}



var format_list_film = function(wdatas, wcb)
{
    var list_film = wdatas.list_film;
    var dictionnary_film = {};
    var tab_film = [];
    var genre = wdatas.genre;

    var description_ville = list_film[0]["ville_description"]["value"];
    wdatas.description_ville = description_ville;

    list_film.map(function(elt){

        var tmp = {

            name: elt["nom_video"]["value"],
            adresse: [],
            ville: elt["ville"]["value"],
            note: parseInt(elt["note"]["value"])
        }

        if(! dictionnary_film[elt["nom_video"]["value"]])
        {
            dictionnary_film[elt["nom_video"]["value"]] = tmp ;
        }

        if(dictionnary_film[elt["nom_video"]["value"]]["adresse"].indexOf(elt["adresse"]["value"]) == -1)
        {
            dictionnary_film[elt["nom_video"]["value"]]["adresse"].push(elt["adresse"]["value"]);
        }

    });

    for (var film in dictionnary_film)
    {
        tab_film.push(dictionnary_film[film]);
    }

    if(genre != "all")
    {
        tab_film = tab_film.filter(function(elt)
        {

            if(elt["genre"].indexOf(genre) != -1)
            {
                return true;
            }
            else
            {
                return false;
            }

        })

    }

    tab_film.sort(function(film_a, film_b){
        film_b["note"] - film_a["note"];
    });



    wdatas.tab_film = tab_film.slice(0,4);
    return wcb(null, wdatas);

}

var format_list_adresse = function(wdatas, wcb)
{
    console.log("format_list_adresse")
    var tab_film = wdatas.tab_film;

    var tab_adresse = [];

    for(var i = 0; i<tab_film.length; i++)
    {
        var film = tab_film[i];
        film["adresse"].map(function(elt){
            tab_adresse.push(elt+','+film["ville"])
            return elt;
        });

    }
    wdatas.tab_adresse = tab_adresse;
    return wcb(null, wdatas);
}


var get_geocoding_values = function(wdatas, wcb)
{
     console.log("get_geocoding_values")
    var token_mapbox = wdatas.token_mapbox;
    var tab_adresse = wdatas.tab_adresse.slice(0,2);
    var geo_coding_tab_adresse = [];
    tab_adresse=["4 rue des troubadours, Labège France", "Place du Capitole, Toulouse France"]
    async.eachLimit(tab_adresse, 1, function(adresse, cb)
    {
        var url = "https://api.mapbox.com/geocoding/v5/mapbox.places/"+adresse+".json?limit=5&language=fr&access_token="+token_mapbox;
        var options = {
          method: 'GET',
          url: url,
          json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log(error)
                return cb(null, null);
            }
            else
            {

                var data = body.features[0].geometry;
                geo_coding_tab_adresse.push(data);

                return cb(null, null);
            }
        });
    },
    function(err, result)
    {
        if(err)
        {
            console.log(err);
            return wcb("[get_geocoding_values]"+err, wdatas);
        }
        else
        {
            wdatas.geo_coding_tab_adresse = geo_coding_tab_adresse;
            return wcb(null, wdatas);
        }

    });
}

var get_directions = function(wdatas, wcb)
{
    console.log("get_directions")
    var geo_coding_tab_adresse = wdatas.geo_coding_tab_adresse;
    var token_mapbox = wdatas.token_mapbox;
    var url = "https://api.mapbox.com/directions/v5/mapbox/cycling/"
    for(var i = 0; i<geo_coding_tab_adresse.length; i++)
    {
        url += geo_coding_tab_adresse[i]["coordinates"][0] + "," + geo_coding_tab_adresse[i]["coordinates"][1] + ";"
    }

    var url = url.substring(0, url.length - 1);

    url += "?access_token="+token_mapbox;
    url += "&language=fr";
    url += "&steps=true";
    url += "&geometries=geojson";

    var options = {
      method: 'GET',
      url: url,
      json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error)
            return wcb("[get_directions]", null);
        }
        else
        {
            wdatas.directions = body;
            return wcb(null, wdatas);
        }
    });
}
