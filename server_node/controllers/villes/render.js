var async=require('async');
var request=require('request');

module.exports = function (req, res, next) {

    async.waterfall([

        function (wcb) {
            var wdatas= {

                    ville_id: req.params.id || "ville0",
                    url_fuseki_update: "http://localhost:3030/cinemaTP",
                    genre: "all"

            	};

            return wcb(null,wdatas);
        },

        call_db,

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][home][render]"+error)
            return res.render ("error.ejs", {});

        }else{
        	return res.render ("ville/render.ejs", {tab_genre: result.tab_genre});
        }

    });
};



var call_db = function(wdatas, wcb)
{
    var ville_id = wdatas.ville_id;

     var url_fuseki_update = wdatas.url_fuseki_update;
    var query = 'PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#>'
    query += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    query += "SELECT ?nom_video  ?adresse ?ville ?note ?genre WHERE {"
    query += "?video a :film ."
    query += "?video rdfs:label ?nom_video ."
    query += "?video :aPourNote ?note ."
    query += "?video :aPourGenre ?genre_uri ."
    query += "?genre_uri rdfs:label ?genre ."
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
            var list_film = body.results.bindings;
            wdatas.list_film = list_film; 
            return wcb(null, wdatas);
        }
    });
}



var format_list_film = function(wdatas, wcb)
{
    var list_film = wdatas.list_film;
    var tab_genre = [];
    var genre = wdatas.genre;

    list_film.map(function(elt){

        if(tab_genre.indexOf(elt["genre"]["value"]) == -1)
        {
            tab_genre.push(elt["genre"]["value"]);
        }
    });

  
    wdatas.tab_genre = tab_genre;
    return wcb(null, wdatas);

}