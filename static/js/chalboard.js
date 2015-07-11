
//http://stackoverflow.com/a/2648463 - wizardry!
String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

function htmlentities(string) {
    return $('<div/>').text(string).html();
}

var challenges;

function loadchal(id) {
    obj = $.grep(challenges['game'], function (e) {
        return e.id == id;
    })[0]
    window.location.hash = obj.name
    scrollTo(id);
}

function holdOpen(id){
    var row = $('#row_' + id);
       
    //Keep question open even after submit 
    if($(row).hasClass("Off")){
        $(row).unbind('mouseenter mouseleave');
        $(row).toggleClass("On Off");
    }
}

function scrollTo(id){
    var row = $('#row_' + id);
    var content = $(row).children(0).children(0);
    
    $('html, body').animate({
        scrollTop: $(row).offset().top
    }, 2000);
    
    //Make Content Visible if not already
    if(!$(content).is(":visible"))
        $(content).trigger('mouseenter');
}

function loadchalbyname(chalname) {
  obj = $.grep(challenges['game'], function (e) {
      return e.name == chalname;
  })[0]
  window.location.hash = obj.name
  scrollTo(obj.id);
}

function submitkey(chal, key, nonce) {
    var button = $('#row_' + chal).children(0).children(0).find('button')[0];
    $(button).prop('disabled', true);
    holdOpen(chal);
    $.post("/chal/" + chal, {
        key: key, 
        nonce: nonce
    }, function (data) {
        if (data == -1){
          window.location="/login"
          return
        }
        else if (data == 0){ // Incorrect key
            $.blockUI({ 
                theme: false,
                message: 'Eeep! That is not the answer.', 
                timeout: 3000,
                css: { backgroundColor: 'red', color: 'white', height: '8em', width: '25em', padding: 14 } 
            });
        }
        else if (data == 1){ // Challenge Solved
            $.blockUI({ 
                theme: false,
                message: 'Eureka! That is correct!', 
                timeout: 3000,
                css: { backgroundColor: 'green', color: 'white', height: '8em', width: '25em', padding: 14 } 
            });
        }
        else if (data == 2){ // Challenge already solved
            $.blockUI({ 
                theme: false,
                message: 'You already solved this one silly!', 
                timeout: 3000,
                css: { backgroundColor: 'yellow', color: 'black', height: '8em', width: '25em', padding: 14 }
            });
        }
        else if (data == 3){ // Keys per minute too high
            $.blockUI({ 
                theme: false,
                message: 'Slow down there killer! You look like a script!', 
                timeout: 3000,
                css: { backgroundColor: 'red', color: 'white', height: '8em', width: '25em', padding: 14 }
            });
        }
        else if (data == 4){ // too many incorrect solves
            $.blockUI({ 
                theme: true,
                message: 'No cookie for you! You exceeded the max solve attempts.', 
                timeout: 3000,
                css: { backgroundColor: 'red', color: 'black', height: '8em', width: '25em', padding: 14 }
            });
        }
        marktoomanyattempts()
        marksolves()
        updatesolves()
        $(button).prop('disabled', false);
    })
}

function marksolves() {
    $.get('/solves', function (data) {
        solves = $.parseJSON(JSON.stringify(data));
        for (var i = solves['solves'].length - 1; i >= 0; i--) {
            id = solves['solves'][i].chalid;
            if(!$('#row_' + id).hasClass('solved'))
                $('#row_' + id).addClass('solved');
            $('#row_' + id).children().prop('title', 'Solved!');
        };
        hideSolved();
    });
}

function marktoomanyattempts() {
    $.get('/maxattempts', function (data) {
        maxattempts = $.parseJSON(JSON.stringify(data));
        for (var i = maxattempts['maxattempts'].length - 1; i >= 0; i--) {
            id = maxattempts['maxattempts'][i].chalid
            if(!$('#row_' + id).hasClass('exceeded'))
                $('#row_' + id).addClass('exceeded');
            $('#row_' + id).children().prop('title', 'Max submissions exceeded!');
            
        };
    });
}

function updatesolves(){
    $.get('/chals/solves', function (data) {
      solves = $.parseJSON(JSON.stringify(data));
      chals = Object.keys(solves);

      for (var i = 0; i < chals.length; i++) {  
        obj = $.grep(challenges['game'], function (e) {
            return e.name == chals[i];
        })[0]
        obj.solves = solves[chals[i]]
        $('#row_' + obj.id).children()[5].innerHTML = obj.solves;
      }; 
    });
}

function getsolves(id){
  $.get('/chal/'+id+'/solves', function (data) {
    var teams = data['teams'];
    var box = $('#chal-solves-names');
    box.empty();
    for (var i = 0; i < teams.length; i++) {
      var id = teams[i].id;
      var name = teams[i].name;
      var date = moment(teams[i].date).local().format('LLL');
      box.append('<tr><td><a href="/team/{0}">{1}</td><td>{2}</td></tr>'.format(id, htmlentities(name), date));
    };
  });
}

function loadchals() {

    $.get("/chals", function (data) {
        categories = [];
        challenges = $.parseJSON(JSON.stringify(data));
        
        $('#challenges').append('<thead><tr><th class="nosort"/><th>Id</th><th>Name</th><th>Category</th><th>Points</th><th>Solves</th></tr></thead><tbody>');
        var categories;
        for (var i = challenges['game'].length - 1; i >= 0; i--) {
            challenges['game'][i].solves = 0;
            
            var challenge = challenges['game'][i];
            var description = challenge.description.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br/>$2');
            var id = challenge.id;
            var name = challenge.name;
            var category = challenge.category;
            var value = challenge.value;
            var files = "";
            categories[category]=1;
            
            for(var x=0; x < challenge.files.length; x++){
                files += '<br/><a href="' + challenge.files[x] + '">' + challenge.files[x].replace(/^.*[\\\/]/, '') + "</a>";
            }
            
            $('#challenges').append('<TR id="row_' + id + '"><td style="width:1px;"><div style="display:none;"><p>' + description + files +
                                    '<br/><input style="width:40em;" type="text" placeholder="Flag Value" /><button>Submit</button></p>' +
                                    '</div></td><td>' + id + '</td><td>' + name + '</td>' +
                                    '<td>' + category + '</td><td>' + value + '</td><td>0</td></tr>' +"\n");
        };

        $.each(Object.keys(categories).sort(), function(key, value) {  
                                    $('#cat-filter')
                                        .append($("<option></option>")
                                        .attr("value",value)
                                        .text(value)); 
                               });
        $('#hide-solved').change(function(){hideSolved();});        
        $('#cat-filter').change(function(){filterCategories(); });
                                  
        $('#challenges').append('</tbody>');
        $('#challenges').addClass('tablesorter');
        updatesolves()
        marktoomanyattempts()
        marksolves()

        //Setup Actions & Formatting on inserted items
        var hover_action = function(){
          var content = $(this).children(0).children(0);
          $(content).toggle();
          if($(content).is(":visible")){ 
            var margLeft = Math.max(20, ($(this).width() - $(content).width())/2);
            //$(content).css('margin-left', margLeft).css('margin-right', margLeft).css('margin-top', $(this).height());
            $(content).css('margin-left', 24).css('margin-top', $(this).height());
            $(this).outerHeight($(this).height() + $(content).height());
          } else {
            $(this).height('auto');
          }
        };

        $('#challenges tr td').parent().hover(hover_action);

        $('#challenges tr td').parent().click(
          function(){ 
            $(this).toggleClass('On Off');
            if($(this).hasClass('On'))
              $(this).hover(hover_action);
            else
              $(this).unbind('mouseenter mouseleave');
          }
        );

        $('#challenges tr td').parent().addClass("On");
        $('#challenges tr td').css('vertical-align', 'top');
        $('#challenges tr td div').css('position', 'absolute');
        
        $('button').click(function(){ 
                            var id = parseInt($(this).parent().closest('tr').children('td')[1].innerHTML);
                            var desc = $(this).parent().closest('tr').children('td')[0];
                            var key = $(desc).find('input')[0].value;
                            var nonce = $('#nonce').val();
                            submitkey(id,key,nonce);
                        }
                );
        $("#challenges").tablesorter({ sortList: [[1,0],[2,0]] });
    });
}

function hideSolved(){ 
  if($('#hide-solved').is(":checked"))
    $('.exceeded, .solved').css('display', 'none');
  else
    $('.exceeded, .solved').css('display', '');
}

function filterCategories(){    
    var name = $('#cat-filter').val();
    if(name=='All'){
      $('#challenges tr td').parent().each(
          function(){
            $(this).css('display', '');
            if($(this).hasClass('Off')){
              $(this).click();
              $(this).trigger("mouseout");
            }
          });
      hideSolved();
      return;
    }

    $('#challenges tr td').parent().each(function(){
      if ($(this).find('td:eq(3)').text()!=name){
        $(this).css('display', 'none');
        if($(this).hasClass('Off')){
          $(this).click();
          $(this).trigger("mouseout");
        }
      } else {
        //If it has either solved or exceeded class set, and hiding solved, skip the resetting of display
        if(($(this).hasClass('solved') || $(this).hasClass('exceeded')) && $('#hide-solved').is(":checked"))
            return;
        $(this).css('display', '');  
        $(this).trigger("mouseenter");
        $(this).click();
      }
    });
}



// $.distint(array)
// Unique elements in array
$.extend({
    distinct : function(anArray) {
       var result = [];
       $.each(anArray, function(i,v){
           if ($.inArray(v, result) == -1) result.push(v);
       });
       return result;
    }
});
function colorhash (x) {
    color = ""
    for (var i = 20; i <= 60; i+=20){
        x += i
        x *= i
        color += x.toString(16)
    };
    return "#" + color.substring(0, 6)
}

$(document).on('close', '[data-reveal]', function () {
  window.location.hash = ""
});

function update(){
    solves_graph();
    marktoomanyattempts();
    marksolves();
    updatesolves();
}

$(function() {
    loadchals();
});

setInterval(update, 300000);