var async=require('async');
var request=require('request');

module.exports = function (req, res, next) {


async.waterfall([

        function (wcb) {
            var wdatas= {};

            return wcb(null,wdatas);
        },

    ],
    function(error,result){

        if(error || !result){

            console.log(error);
            console.log("[Controllers][home][ajax]"+error)
            return res.status(500).json({error: true});

        }else{

        	return res.status(200).json({success: true});

        }

    });
};
