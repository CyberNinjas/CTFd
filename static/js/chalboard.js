
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
    $('#chal-window .chal-name').text(obj.name)
    $('#chal-window .chal-desc').html(marked(obj.description, {'gfm':true, 'breaks':true}))

    for (var i = 0; i < obj.files.length; i++) {
        filename = obj.files[i].split('/')
        filename = filename[filename.length - 1]
        $('#chal-window .chal-desc').append("<a href='"+obj.files[i]+"'>"+filename+"</a><br/>")
    };

    $('#chal-window .chal-value').text(obj.value)
    $('#chal-window .chal-category').text(obj.category)
    $('#chal-window #chal-id').val(obj.id)
    $('#chal-window .chal-solves').text(obj.solves + " solves")
    $('#answer').val("")

    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
    $('#chal-window').foundation('reveal', 'open');
}

function loadchalbyname(chalname) {
  obj = $.grep(challenges['game'], function (e) {
      return e.name == chalname;
  })[0]
  window.location.hash = obj.name
  $('#chal-window .chal-name').text(obj.name)
  $('#chal-window .chal-desc').html(marked(obj.description, {'gfm':true, 'breaks':true}))

  for (var i = 0; i < obj.files.length; i++) {
      filename = obj.files[i].split('/')
      filename = filename[filename.length - 1]
      $('#chal-window .chal-desc').append("<a href='"+obj.files[i]+"'>"+filename+"</a><br/>")
  };

  $('#chal-window .chal-value').text(obj.value)
  $('#chal-window .chal-category').text(obj.category)
  $('#chal-window #chal-id').val(obj.id)
  $('#chal-window .chal-solves').text(obj.solves + " solves")
  $('#answer').val("")

  $('pre code').each(function(i, block) {
      hljs.highlightBlock(block);
  });
  
  $('#chal-window').foundation('reveal', 'open');
}


$("#answer").keyup(function(event){
    if(event.keyCode == 13){
        $("#submit-key").click();
    }
});


function submitkey(chal, key, nonce) {
    $.post("/chal/" + chal, {
        key: key, 
        nonce: nonce
    }, function (data) {
        if (data == -1){
          window.location="/login"
          return
        }
        else if (data == 0){ // Incorrect key
          $('#submit-key').text('Incorrect, sorry')
          $('#submit-key').css('background-color', 'red')
          $('#submit-key').prop('disabled', true)
        }
        else if (data == 1){ // Challenge Solved
          $('#submit-key').text('Correct!')
          $('#submit-key').css('background-color', 'green')
          $('#submit-key').prop('disabled', true)
          $('#chal-window .chal-solves').text( (parseInt($('#chal-window .chal-solves').text().split(" ")[0]) + 1 +  " solves") )
        }
        else if (data == 2){ // Challenge already solved
          $('#submit-key').text('You already solved this')
          $('#submit-key').prop('disabled', true)
        }
        else if (data == 3){ // Keys per minute too high
          $('#submit-key').text("You're submitting keys too fast. Slow down.")
          $('#submit-key').css('background-color', '#e18728')
          $('#submit-key').prop('disabled', true)
        }
        else if (data == 4){ // too many incorrect solves
          $('#submit-key').text('Too many attempts.')
          $('#submit-key').css('background-color', 'red')
          $('#submit-key').prop('disabled', true)
        }
        marktoomanyattempts()
        marksolves()
        updatesolves()
        setTimeout(function(){
          $('#submit-key').text('Submit')
          $('#submit-key').prop('disabled', false)
          $('#submit-key').css('background-color', '#007095')
        }, 3000);
    })
}

function marksolves() {
    $.get('/solves', function (data) {
        solves = $.parseJSON(JSON.stringify(data));
        for (var i = solves['solves'].length - 1; i >= 0; i--) {
            id = solves['solves'][i].chalid
            $('#challenges button[value="' + id + '"]').addClass('secondary')
            $('#challenges button[value="' + id + '"]').css('opacity', '0.3')
        };
        if (window.location.hash.length > 0){
          loadchalbyname(window.location.hash.substring(1))
        }
    });
}

function marktoomanyattempts() {
    $.get('/maxattempts', function (data) {
        maxattempts = $.parseJSON(JSON.stringify(data));
        for (var i = maxattempts['maxattempts'].length - 1; i >= 0; i--) {
            id = maxattempts['maxattempts'][i].chalid
            $('#challenges button[value="' + id + '"]').addClass('secondary')
            $('#challenges button[value="' + id + '"]').css('background-color', '#FF9999')
        };
        if (window.location.hash.length > 0){
          loadchalbyname(window.location.hash.substring(1))
        }
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
        
        $('#challenges').append('<TR><th/><th>Id</th><th>Name</th><th>Category</th><th>Points</th></TR>');

        for (var i = challenges['game'].length - 1; i >= 0; i--) {
            challenges['game'][i].solves = 0;
            
            var challenge = challenges['game'][i];
            var description = challenge.description.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br/>$2');
            var id = challenge.id;
            var name = challenge.name;
            var category = challenge.category;
            var value = challenge.value;
            var files = "";
            for(var x=0; x < challenge.files.length; x++){
                files += '<br/><a href="' + challenge.files[x] + '">' + challenge.files[x].replace(/^.*[\\\/]/, '') + "</a>";
            }
            
            $('#challenges').append('<TR><td><div style="display:none;"><p>' + description + files +
                                    '<br/><input type="text" placeholder="Flag Value" /><input type="Submit" name="Submit"/></p>' +
                                    '</div></td><td>' + id + '</td><td>' + name + '</td>' +
                                    '<td>' + category + '</td><td>' + value + '</td></tr>' +"\n");
        };

        updatesolves()
        marktoomanyattempts()
        marksolves()

        //Setup Actions & Formatting on inserted items
        var hover_action = function(){
          var content = $(this).children(0).children(0);
          $(content).toggle();
          if($(content).is(":visible")){ 
            var margLeft = Math.max(20, ($(this).width() - $(content).width())/2);
            $(content).css('margin-left', margLeft).css('margin-right', margLeft).css('margin-top', $(this).height());
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
    });
}

$('#submit-key').click(function (e) {
    submitkey($('#chal-id').val(), $('#answer').val(), $('#nonce').val())
});

$('.chal-solves').click(function (e) {
    getsolves($('#chal-id').val())
});

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

// function solves_graph() {
//     $.get('/graphs/solves', function(data){
//         solves = $.parseJSON(JSON.stringify(data));
//         chals = []
//         counts = []
//         colors = []
//         i = 1
//         $.each(solves, function(key, value){
//             chals.push(key)
//             counts.push(value)
//             colors.push(colorhash(i++))
//         });

//     });
// }

function update(){
    $('#challenges').empty();
    loadchals();
    solves_graph();
}

$(function() {
    loadchals();
    // solves_graph()
});

setInterval(update, 300000);