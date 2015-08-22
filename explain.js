function begin(){
    $("body").append("<div id='explain-content' class='box'> <img src='http://explainxkcdmirror.net63.net/load.gif' id='explain-load' style='padding:20px;'> </div>");
}

function getUrl(url,callback){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4) {
            callback(xhr.responseText);
        }
    };
    xhr.open("GET", url, true);
    xhr.send();
}

function getCurrentUrl(callback){
    var query = { active: true, currentWindow: true };
    function tabCallback(tabs) {
        b=tabs;
        currentUrl = tabs[0]["url"];
        callback();
    }
    chrome.tabs.query(query, tabCallback);
}
function getLatestNumber(callback){
    function gotWikiText(req){
        req=JSON.parse(req);
        console.log("got latest number");
        callback(req["num"]);
    }
    
    getUrl("http://dynamic.xkcd.com/api-0/jsonp/comic/",gotWikiText);
}
function getNumberFromPage(pageName,callback){
    if( currentUrl.search(/^http(s|):\/\/(www\.|)xkcd.(com|org)\/$/)===0 ){
        getLatestNumber(callback);
    }
    else{
        var noSlashes=currentUrl.match(/http(s|):\/\/(www\.|)xkcd\.(com|org)\/(.*).(\/|)/);
        if(noSlashes==null){
            Error("Could not get comic number from page");
        }
        else{
            callback(noSlashes[4]);
        }
    }
}

function getFullName(pageNum){
    function gotFullName(req){
        req=JSON.parse(req);

        for(page in req["query"]["pages"]){var pageId=page;}//the easiest way to get the numeric id of a page
        var redirectWikiText=req["query"]["pages"][pageId]["revisions"][0]["*"];
        
        var redirectTo=redirectWikiText.match(/\[\[(.*)\]\]/)[1];
        getHtml(redirectTo,pageNum);
    }
    
    getUrl("http://explainxkcd.com/wiki/api.php?format=json&action=query&prop=revisions&rvprop=content&titles="+pageNum,gotFullName);

}

function getHtml(pageName,pageNum){
    function gotHtml(req){
        req=JSON.parse(req);
        
        var html=req["parse"]["text"]["*"];
        parseHtml(html,pageNum);
    }
    
    getUrl("http://explainxkcd.com/wiki/api.php?format=json&action=parse&page="+pageName,gotHtml);
}

function parseHtml(html,pageNum){ 
    html=html.replace(/(\r\n|\n|\r)/gm,"");
    var explanation=html.match(/id="Explanation">(.*)<\/span><\/h2>(.*?)<h2><span class="editsection">\[<a href=".*" title="Edit section: Transcript">edit<\/a>\]<\/span> <span class="mw-headline" id="Transcript">Transcript<\/span><\/h2>/)[2];
    var title=html.match(/Title text:<\/span>(.*?)<\/span>/)[1];
    build({"explanation":explanation,"title":title,"num":pageNum});
}

function fixRelative(){
    $("#explain-explain a").each(function(){
        var href=$(this).attr("href");
        if(! href.match(/^http(s|):\/\//) ){//the url is relative
            $(this).attr("href","http://explainxkcd.com"+href);
        }
    });
    
    $("#explain-explain img").each(function(){
        var src=$(this).attr("src");
        if(! src.match(/^http(s|):\/\//) ){//the url is relative
            $(this).attr("src","http://explainxkcd.com"+src);
        }
    });
}
function build(page){
    console.log(page);
    $("#explain-content").append("<div id='explain-title'>Title: "+page["title"]+"</div> <div id='explain-explain'> <h2>Explanation</h2> "+page["explanation"]+"</div>");
    $("#explain-content").append("<p id='explain-footer'> <a id='explain-ccLicense' rel='license' href='http://creativecommons.org/licenses/by-sa/3.0/'><img alt='Creative Commons License' style='border-width:0' src='https://i.creativecommons.org/l/by-sa/3.0/88x31.png' /></a><br />This content is licensed under a <a rel='license' href='http://creativecommons.org/licenses/by-sa/3.0/'>Creative Commons Attribution-ShareAlike 3.0 Unported License</a> by it's origional author. <br> This content fetched by a script owned by a xkcd user not affiliated with xkcd.com or explainxkcd.com. <br> Content from <a href='http://explainxkcd.com/"+page["num"]+"'>explainxkcd.com</a>. </p>");
    fixRelative();
    
    $("#explain-load").remove();
    if(endCallback!==undefined){
        endCallback();
    }
}

function main(){
    if( currentUrl.search(/http(s|):\/\/(www\.|)xkcd.(com|org)\/.*(\/|)/)===0 ){//we are on a valid comic url
        begin();
        getNumberFromPage(currentUrl,getFullName);
    }
    else{
        $("body").append("<p class='explain-error'>This extension will explain a xkcd comic. Simply go to any comic at xkcd.com and click on this extension.</p>");
    }
}
