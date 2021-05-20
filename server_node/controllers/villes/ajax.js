var async=require('async');
var request=require('request');

module.exports = function (req, res, next) {


async.waterfall([

        function (wcb) {
            var wdatas= {

                ville_id: req.param.id,
                url_fuseki_update: "http://localhost:3030/cinemaTP",
                genre: req.body.genre || "all"

            };

            return wcb(null,wdatas);
        },

        call_db,
        format_list_film,

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][villes][ajax]"+error)
            return res.status(500).json({error: true});

        }else{

        	return res.status(200).json({list_film: tab_film});

        }

    });
};


var call_db = function(wdatas, wcb)
{
    var ville_id = wdatas.ville_id;

     var url_fuseki_update = wdatas.url_fuseki_update;
    var query = 'PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#>'
    query += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    query += "SELECT ?nom_video  ?adresse ?ville ?note WHERE {"
    query += "?video a :film ."
    query += "?video rdfs:label ?nom_video ."
    query += "?video :aPourNote ?note ."
    query += "?video :aEteRealiseA ?adresse_uri ."
    query += "?adresse_uri rdfs:label ?adresse ."
    query += "?adresse_uri :seSitueDans ?quartier_uri ."
    query += "?quartier_uri :seSitueDans ?ville_uri ."
    query += "?ville_uri rdfs:label ?ville ."
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
            console.log(body.results.bindings)
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