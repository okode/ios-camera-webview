$(document).ready(function() {
	$('#container').WebformToolkit({
		id     : 'form',
		fields : jsonForm
	}, readyForm, submitForm);
	initForm();
});

function readyForm(form) {
    if(jsonPopulateData != 'JSON_POPULATE_DATA') {
        // Populate form data
        $(form).populate(jsonPopulateData);
    }
    if(readOnlyMode) {
        // Set read only form mode
        setReadOnlyForm();
    }
}

function submitForm(form) {
	jsonResult = form.serializeJSON();
	window.location = 'webform://submit';
}

function setReadOnlyForm() {
	$("form, form input, form select, form textarea").blur();
	$('form, form input, form select, form textarea').each(function() {
		if($(this).not(':disabled')) {
			$(this).addClass('readOnlyMode').attr('disabled',true);
		}
	});
	$('input[type="checkbox"]').each(function() {
		if(!$(this).is(':checked')) {
			$(this).parent().parent().addClass('readOnlyModeHidden').css('display','none');
		}
	});
	$('input[type="radio"]').each(function() {
		if(!$(this).is(':checked')) {
			$(this).parent().addClass('readOnlyModeHidden').css('display','none');
		}
	});
	$(':input').each(function(){
		if(!$(this).attr('json-populated')) {
			$(this).parent('div').addClass('readOnlyModeHidden').css('display','none');
		}
	});
	$('.radios').each(function(){
		if($('.radio:visible', this).length == 0) {
			$(this).parent('div').addClass('readOnlyModeHidden').css('display','none');
		}
	});
	$('fieldset > div:not(.readOnlyModeHidden)').each(function() {
		var totalDivChilds = $('> div', this).length;
		var invisibleContainerDivChilds = $('> div.inputContainer.readOnlyModeHidden', this).length;
		if(totalDivChilds > 0 && totalDivChilds == invisibleContainerDivChilds) {
			$(this).addClass('readOnlyModeHidden').css('display','none');
		}
	});
	$('fieldset').each(function() {
		if($(this).children('div:visible').length == 0) {
			$(this).addClass('readOnlyModeHidden').css('display','none');
		}
	});
	$('fieldset').each(function(){
		if($('> div:not(.readOnlyModeHidden)', this).length == 0) {
			$(this).addClass('readOnlyModeHidden').css('display','none');
		}
	});

	$('input[type="tel"].readOnlyMode').each(function() {
		var val = $(this).val();
		if(val != null && val != "") {
			var a = $('<a></a>').addClass('telInputReadOnly').attr('href','tel:'+val);
			$(this).after(a);
		}
	});
	$('input[type="email"].readOnlyMode').each(function() {
		var val = $(this).val();
		if(val != null && val != "") {
			var a = $('<a></a>').addClass('emailInputReadOnly').attr('href','mailto:'+val);
			$(this).after(a);
		}
	});

	/* hide default placeholder in empty inputs yyyy-mm-dd | --:-- */
	$('input[type="date"], input[type="time"]').each(function(){
		if($(this).val() == "" || $(this).val() == null) { $(this).css('opacity',0); }
	});	
    readOnlyMode = true;
}

function setEditableForm() {
	$('form, form input, form select, form textarea').each(function() {
		if($(this).hasClass('readOnlyMode')) {
			$(this).removeClass('readOnlyMode').attr('disabled',false);
		}
    });
	$('.readOnlyModeHidden').each(function() {
		$(this).removeClass('readOnlyModeHidden').css('display','block');
	});
	$('.telInputReadOnly, .emailInputReadOnly').remove();
	/* show default placeholder in empty inputs yyyy-mm-dd | --:-- */
	$('input[type="date"], input[type="time"]').each(function(){
		if($(this).val() == "" || $(this).val() == null) { $(this).css('opacity',1); }
	});
    readOnlyMode = false;
}

function getFormResultSubmitted() {
	return jsonResult;
}

function getFormValues() {
	return $(form).serializeJSON();
}

/********/

function initForm() {
	if(Utils.isAndroid()) {
		if(Utils.androidVersion() < 4.4) {
			$('body').addClass('androidNotChromium');
		} else {
			$('body').addClass('androidChromium');
		}
	}
}

/********/

$(document).ready(function() {

	$(":input").each(function (i) { $(this).attr('tabindex', i + 1); });
	var tabindex = 1; //start tabindex || 150 is last tabindex
	
	$(document).keypress(function(event) {
	    var keycode = (event.keyCode ? event.keyCode : event.which);
	    if(keycode == '13') { //onEnter
	        tabindex++;
	        $('[tabindex=' + tabindex + ']').focus();
	        return false;
	    }
	});
	
	$("input").click(function() { //if changing field manualy with click - reset tabindex 
	    var input = $(this);
	    tabindex = input.attr("tabindex");
	});

});

/********/

Date.prototype.toFormattedString = function(f) {
    f = f.replace(/yyyy/g, this.getFullYear());
    f = f.replace(/yy/g, String(this.getFullYear()).substr(2,2));
    f = f.replace(/mm/g, String(this.getMonth()+1).padLeft('0',2));
    f = f.replace(/dd/g, String(this.getDate()).padLeft('0',2));
    f = f.replace(/HH/g, String(this.getHours()).padLeft('0',2));
    f = f.replace(/MM/g, String(this.getMinutes()).padLeft('0',2));
    return f;
};

String.prototype.padLeft = function(value, size) {
    var x = this;
    while (x.length < size) {x = value + x;}
    return x;
};

var Utils = {};

Utils.isAndroid = function() {
    var ua = ua || navigator.userAgent; 
    var match = ua.match(/Android\s([0-9\.]*)/);
    return match ? true : false;
};

Utils.androidVersion = function() {
    var ua = ua || navigator.userAgent; 
    var match = ua.match(/Android\s([0-9\.]*)/);
    return match ? parseFloat(match[1]) : false;
};








/*********/
/*
	TESTS


$(document).ready(function() {
	$('input[type="submit"]').after(
		'<br><br>' +
		'<a onclick="alert(getFormValues())" style="text-align:center;width:100%;display:block;line-height:20px;">Ver contenido del formulario</a><br>' +
		'<a onclick="setReadOnlyForm()" style="text-align:center;width:100%;display:block;line-height:20px;">Sólo lectura</a><br>' +
		'<a onclick="setEditableForm()" style="text-align:center;width:100%;display:block;line-height:20px;">Edición</a><br>'
	);
});
*/