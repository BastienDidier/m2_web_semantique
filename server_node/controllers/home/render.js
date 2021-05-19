var async=require('async');
var request=require('request');

module.exports = function (req, res, next) {


async.waterfall([

        function (wcb) {
            var wdatas= {



            	};

            return wcb(null,wdatas);
        }

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][home][render]"+error)
            return res.render ("error.ejs", {});

        }else{
        	return res.render ("home/render.ejs", {});
        }

    });
};
