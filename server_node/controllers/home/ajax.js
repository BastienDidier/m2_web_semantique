var async=require('async');
var request=require('request');

module.exports = function (req, res, next) {


    async.waterfall([

        function (wcb) {
            var wdatas= {
                url_fuseki_update: "http://localhost:3030/cinemaTP"
            };

            return wcb(null,wdatas);
        },

        get_list_ville,
        format_list_ville,

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][home][ajax]"+error)
            return res.status(500).json({error: true});

        }else{

        	return res.status(200).json({
                list_genre: result.list_genre,
                data: result.dictionnary_city
            });

        }

    });
};


var get_list_ville = function(wdatas, wcb)
{
    var url_fuseki_update = wdatas.url_fuseki_update;
    var query = 'PREFIX : <http://www.semanticweb.org/nathalie/ontologies/2017/1/untitled-ontology-161#>'
    query += "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>"
    query += "SELECT ?nom_video ?note ?nb_vote ?genre ?adresse ?ville ?ville_uri WHERE {"
    query += "?video a :film ."
    query += "?video rdfs:label ?nom_video ."
    query += "?video :aPourNote ?note ."
    query += "?video :a_un_nombre_de_vote ?nb_vote ."
    query += "?video :aPourGenre ?genre_uri ."
    query += "?genre_uri rdfs:label ?genre ."
    query += "?video :aEteRealiseA ?adresse_uri ."
    query += "?adresse_uri rdfs:label ?adresse ."
    query += "?adresse_uri :seSitueDans ?quartier_uri ."
    query += "?quartier_uri :seSitueDans ?ville_uri ."
    query += "?ville_uri rdfs:label ?ville ."

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

var format_list_ville = function(wdatas, wcb)
{

    var list_film = wdatas.list_film;
    var dictionnary_city = {};
    var dictionnary_film = {};

    var list_genre = [];
    list_film.map(function(elt){


        var tmp = {

            name: elt["nom_video"]["value"],
            note: elt["note"]["value"],
            nb_vote: elt["nb_vote"]["value"],
            genre: [],
            adresse: [],
            ville: elt["ville"]["value"],
            id_ville: elt["ville_uri"]["value"].split("#")[1]
        }

        if(! dictionnary_film[elt["nom_video"]["value"]])
        {
            dictionnary_film[elt["nom_video"]["value"]] = tmp ;
        }

        if(dictionnary_film[elt["nom_video"]["value"]]["genre"].indexOf(elt["genre"]["value"]) == -1)
        {
            dictionnary_film[elt["nom_video"]["value"]]["genre"].push(elt["genre"]["value"]);
        }

        if(dictionnary_film[elt["nom_video"]["value"]]["adresse"].indexOf(elt["adresse"]["value"]) == -1)
        {
            dictionnary_film[elt["nom_video"]["value"]]["adresse"].push(elt["adresse"]["value"]);
        }

    })


    for(var film in dictionnary_film)
    {
        var film_object = dictionnary_film[film];
        var city = film_object["ville"];

        var tmp_object = {
            nom: city,
            nbTotalFilms : 0,
            tab_note: [],
            id_ville: film_object["id_ville"],
            genres: {}
        }

        if(! dictionnary_city[city])
        {
            dictionnary_city[city] = tmp_object
        }

        dictionnary_city[city]["nbTotalFilms"] += 1;
        dictionnary_city[city]["tab_note"].push(film_object["note"]);
        
        for(var i = 0; i<film_object["genre"].length; i++)
        {
            var genre = film_object["genre"][i];
            if(list_genre.indexOf(genre) == -1)
            {
                list_genre.push(genre);
            }

            var tmp_genre_object = {
                nom: genre,
                nbTotalFilms: 1,
                tab_note: [],
                id_ville: film_object["id_ville"],
            };

            if(! dictionnary_city[city]["genres"][genre])
            {
                 dictionnary_city[city]["genres"][genre] = tmp_genre_object;
                 dictionnary_city[city]["genres"][genre]["tab_note"].push(film_object["note"]);
            }
            else
            {
                 dictionnary_city[city]["genres"][genre]["tab_note"].push(film_object["note"]);
                 dictionnary_city[city]["genres"][genre]["nbTotalFilms"] += 1
            }
        }
    }

    for(var city in dictionnary_city)
    {
        var sum = dictionnary_city[city]["tab_note"].reduce((a, b) => {
          return parseInt(a) + parseInt(b);
        });
        var nb_film = dictionnary_city[city]["nb_film"];
        dictionnary_city[city]["note"] = sum / nb_film;
        delete dictionnary_city[city]["tab_note"]; 

        for(var genre_city in dictionnary_city[city]["genres"])
        {
            var sum_genre = dictionnary_city[city]["genres"][genre_city]["tab_note"].reduce((a, b) => {
              return parseInt(a) + parseInt(b);
            });
            var nb_film_genre = dictionnary_city[city]["genres"][genre_city]["nb_film"];
            dictionnary_city[city]["genres"][genre_city]["note"] = sum_genre / nb_film_genre;
            delete dictionnary_city[city]["genres"][genre]["tab_note"]; 
        }
    }

    wdatas.list_genre = list_genre;
    wdatas.dictionnary_city = dictionnary_city;

    return wcb(null, wdatas);

}