(function($) {

    // ---------------------------------------------------------------------------------------------
    // FORM BUILDER - Methods

    var methods = {
        "init" : function(config, readyCallback, submitCallback) {
            return this.each(function() {
                var $this = $(this), data = $this.data();

                var webform = createForm(config, submitCallback);
                $this.append(webform);

                if ($.isEmptyObject(data)) {
                    $this.data({
                        container : webform
                    });
                }

                setButtonState(webform);
                readyCallback(webform);
                return webform;
            });
        },
        "create" : function(config, callback) {
            return this.each(function() {
                var webform = $(this).data().container;
                var field = createField(webform, config);
                // return callback with form and field objects
                if ($.isFunction(callback)) {
                    callback(webform, field);
                }
            });
        },
        "destroy" : function() {
            return this.each(function() {
                $(this).removeData();
            });
        }
    };
    $.fn.WebformToolkit = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist in jQuery.WebformToolkit');
        }
    };

    // ---------------------------------------------------------------------------------------------
    // Form builder

    /**
     * Create form field elements
     * 
     * @param {Object} config
     * @param {Function} callback
     * @returns {Object}
     */
    function createForm(config, callback) {
        var form = $('<form></form>').attr('id', config.id).addClass('webform');

        var submitBtn = false;
        var submitBtnText = "Submit";

        // set POST action URI/URL
        if (config.action) {
            form.attr({
                method : 'POST',
                enctype : 'multipart/form-data',
                action : config.action
            });
        }

        form.attr({
            enctype : 'application/json'
        });

        // create hidden elements, if POST parameters exist
        if (config.params) {
            var pairs = config.params.split('&');

            for (var i = 0; i < pairs.length; i++) {
                var name = pairs[i].split('=');

                var hidden = $('<input></input>').attr({
                    type : 'hidden',
                    name : name[0],
                    value : name[1]
                });

                form.append(hidden);
            }
        }

        // create form field elements
        if (config.fields) {
            var data = (config.fields[0][0]) ? config.fields : new Array(config.fields);

            for (var j = 0; j < data.length; j++) {
                if (data[j].length > 1 || (typeof data[j][0].type !== 'undefined' 
                        && typeof data[j][0].type !== 'name')) {
                    var fields = $('<fieldset></fieldset>').addClass('field_group' + j);
                }

                for (var k = 0; k < data[j].length; k++) {
                    if (typeof data[j][k].type !== 'undefined' 
                            && typeof data[j][k].type !== 'name') {
                        fields.append(createField(form, data[j][k]));
                    } else {
                        if (typeof data[j][k].header !== 'undefined') {
                            fields.append('<legend>' + data[j][k].header + '</legend>');
                        } else {
                            if (typeof data[j][k].submit !== 'undefined') {
                                submitBtn = true;
                                submitBtnText = data[j][k].submit;
                            }
                        }
                    }
                }
                form.append(fields);
            }
        }

        // create the submit button
        if (submitBtn) {

            var button = $('<input></input>').attr({
                type : 'submit',
                value : submitBtnText
            });

            // bind form submit event
            form.submit(function(event) {
                event.preventDefault();

                var $this = $(this);

                if (!errorsExist($this)) {

                    // return callback with form object response
                    if ($.isFunction(callback)) {
                        callback($this);
                    }

                    // POST form values
                    else {
                        $this.get(0).submit();
                    }
                }
            });

            form.append(button);
        }

        return form;
    }

    // -------------------------------------------------------------------------------------------------
    // Fields builder

    /**
     * Create field elements
     * 
     * @param {Object} form
     * @param {Object} config
     * @returns {Object}
     */
    function createField(form, config) {
        var div = $('<div></div>').addClass('field_' + config.name);

        if (config.widthpercent) {
            div.addClass('customWidth');
            div.css('width', config.widthpercent);
        }

        // .. label, if exists
        if (config.label && config.type != 'checkbox') {
            var label = $('<label></label>');
            label.attr('for', config.name);
            label.append(config.label);

            if (config.required == 1 || config.required == 'true') {
                var span = $('<span> *</span>').addClass('required');

                label.append(span);
            }

            div.append(label);
        }

        var elm = jQuery.obj;

        // supported elements
        switch (config.type) {
        case 'text':
        case 'password':
        case 'number':
        case 'tel':
        case 'email':
        case 'hidden':
            elm = createInputElm(config);
            break;

        case 'date':
            elm = createDateElm(config);
            break;

        case 'time':
            elm = createTimeElm(config);
            break;

        case 'file':
            elm = createFileElm(config);
            break;

        case 'textarea':
            elm = createTextAreaElm(config);
            break;

        case 'range':
            elm = createRangeElm(config);
            break;

        case 'select':
            elm = createMenuElm(config);
            break;

        case 'radio':
            elm = createRadioElm(config);
            break;

        case 'checkbox':
            elm = createCheckBoxElm(config);
            break;

        default:
            $.error('Invalid or missing field type');
            break;
        }

        // filter with REGEX
        if ((config.filter || (config.required == 1 || config.required == 'true') 
                || config.max || config.min) && config.type != 'hidden') {
            createElementValidator(elm, config);
        } else {
            elm.on('focusout', function() {
                setButtonState($('form'));
            });
        }

        // style addons (focus label)
        elm.on('focus', function() {
            $(this).siblings('label').addClass('focus');
        });
        elm.on('focusout', function() {
            $(this).siblings('label').removeClass('focus');
        });

        div.append(elm);

        // .. description, if exists
        if (config.description) {
            var p = $('<p>' + config.description + '</p>').addClass('field_desc');
            div.append(p);
        }

        return div;
    }

    /**
     * Create input elements
     * 
     * @param {Object} config
     * @returns {Object}
     */
    function createInputElm(config) {
        var input = $('<input></input>');

        // .. field attributes
        if (config.type) {
            switch (config.type) {
            case 'number':
                // input[type=number] placeholder fix
                input.attr('type', 'text');
                input.attr('onfocus', "this.type='number'");
                input.attr('onblur', "this.type='text'");
                if (config.max) {
                    input.attr('max', config.max);
                }
                if (config.min) {
                    input.attr('min', config.min);
                }
                break;
            default:
                input.attr('type', config.type);
            }
        }

        if (config.name) {
            input.attr('name', config.name);
            input.attr('id', config.name);
        }

        if (config.value) {
            input.attr('value', config.value);
        }

        if (config.placeholder) {
            input.attr('placeholder', config.placeholder);
        }

        if (config.textalign) {
            input.css('textAlign', config.textalign);
        }

        if (config.maxlength) {
            input.attr('maxlength', config.maxlength);
        }

        if (config.max) {
            input.attr('max', config.max);
        }

        if (config.min) {
            input.attr('min', config.min);
        }

        if (config.required == 1 || config.required == 'true') {
            input.prop('required', true);
        }

        // Multiple inputs
        if (config.name && config.name.indexOf('[]') > 0) {
            if (!config.multiple) {
                var div = $('<div class="inputContainer"></div>');
                var button = $('<a>+</a>');
                button.addClass('add');
                button.on('click', function() {
                    addInputMultipleElem(config, div);
                });
                div.append(button);
                createElementValidator(input, config)
                div.append(input);
                div.append($('<div></div>').addClass('clearFix'));
                return div;
            } else {
                return input
            }
        }

        return input;
    }

    /**
     * Create multiple input element (on the fly)
     * 
     * @param {Object} config
     * @param {Object} div
     */
    function addInputMultipleElem(config, div) {
        config.multiple = true;
        var input = createInputElm(config);

        var button = $('<a>-</a>');
        button.addClass('delete');
        button.on('click', function() {
            input.next('p.error_mesg').remove();
            input.remove();
            button.remove();
        });
        createElementValidator(input, config)
        div.append(button);
        div.append(input);
        div.append($('<div></div>').addClass('clearFix'));
    }

    /**
     * Create date element
     * 
     * @param {Object} config
     * @returns {Object}
     */
    function createDateElm(config) {
        var input = $('<input></input>');

        input.attr('type', config.type);
        input.attr('dateformat', config.dateformat);

        if (config.name) {
            input.attr('name', config.name);
            input.attr('id', config.name);
        }

        if (config.value) {
            input.attr('value', config.value);
        }

        if (config.textalign) {
            input.css('textAlign', config.textalign);
        }

        if (config.max) {
            input.attr('max', config.max);
        }

        if (config.min) {
            input.attr('min', config.min);
        }

        if (config.required == 1 || config.required == 'true') {
            input.prop('required', true);
        }

        if (!Modernizr.inputtypes.date || (Utils.isAndroid() && Utils.androidVersion() < 4.4)) {
            // browser not supports input[type="date"]
            var element = $('<span></span>').addClass('datePicker');

            var daySelect = $('<select></select>').addClass('dd');
            daySelect.append('<option value="DD">DD</option>');
            for (var i = 1; i <= 31; i++) {
                val = i < 10 ? "0" + i : i;
                daySelect.append('<option value="' + val + '">' + val + '</option>');
            }
            var monthSelect = $('<select></select>').addClass('mm');
            monthSelect.append('<option value="MM">MM</option>');
            for (var i = 1; i <= 12; i++) {
                val = i < 10 ? "0" + i : i;
                monthSelect.append('<option value="' + val + '">' + val + '</option>');
            }
            var yearSelect = $('<select></select>').addClass('yyyy');
            var currentYear = new Date().getFullYear();
            for (var i = (currentYear + 100); i >= (currentYear - 100); i--) {
                if (new Date().getFullYear() == i) {
                    yearSelect.append('<option value="' + i + '" selected>' + i + '</option>');
                } else {
                    yearSelect.append('<option value="' + i + '">' + i + '</option>');
                }
            }

            $([daySelect, monthSelect, yearSelect]).each(function() {
                $(this).change(function() {
                    var dd = $(this).parent().children('.dd').val();
                    var mm = $(this).parent().children('.mm').val();
                    var yyyy = $(this).parent().children('.yyyy').val();
                    if (parseInt(dd, 10) > 0 && parseInt(mm, 10) > 0 && parseInt(yyyy, 10) > 0) {
                        var date = yyyy + '-' + mm + '-' + dd;
                        $(this).parent().children('input').val(date);
                    } else {
                        $(this).parent().children('input').val("");
                    }
                });
            })

            var dateformat = config.dateformat.replace(/[-/.]/g, "").toLowerCase();

            switch (dateformat) {
                case 'ddmmyyyy':
                    element.append(daySelect);
                    element.append('<span class="separator">/</span>');
                    element.append(monthSelect);
                    element.append('<span class="separator">/</span>');
                    element.append(yearSelect);
                    break;
                case 'mmddyyyy':
                    element.append(monthSelect);
                    element.append('<span class="separator">/</span>');
                    element.append(daySelect);
                    element.append('<span class="separator">/</span>');
                    element.append(yearSelect);
                    break;
                case 'yyyymmdd':
                default:
                    element.append(yearSelect);
                    element.append('<span class="separator">/</span>');
                    element.append(monthSelect);
                    element.append('<span class="separator">/</span>');
                    element.append(daySelect);
            }
            
            // fill combos with populate data
            $(input).on('input',function() {
                var val = $(this).val();
                var dd = val.substring(8,10);
                var mm = val.substring(5,7);
                var yyyy = val.substring(0,4);
                var date = new Date(parseInt(yyyy,10),parseInt(mm,10)-1,parseInt(dd,10));
                // valid date
                if (date.getFullYear() == parseInt(yyyy,10) && 
                        date.getMonth() + 1 == parseInt(mm,10) && 
                        date.getDate() == parseInt(dd,10)) {
                    $(this).siblings('select.dd').val(dd);
                    $(this).siblings('select.mm').val(mm);
                    $(this).siblings('select.yyyy').val(yyyy);
                }
            });

            element.append(input);

            return element;
        } else {
            return input;
        }
    }

    /**
     * Create time element
     * 
     * @param {Object}
     *            config
     * @returns {Object}
     */
    function createTimeElm(config) {
        var input = $('<input></input>');

        input.attr('type', config.type);

        if (config.name) {
            input.attr('name', config.name);
            input.attr('id', config.name);
        }

        if (config.value) {
            input.attr('value', config.value);
        }

        if (config.textalign) {
            input.css('textAlign', config.textalign);
        }

        if (config.max) {
            input.attr('max', config.max);
        }

        if (config.min) {
            input.attr('min', config.min);
        }

        if (config.required == 1 || config.required == 'true') {
            input.prop('required', true);
        }

        if (!Modernizr.inputtypes.time || (Utils.isAndroid() && Utils.androidVersion() < 4.4)) {
            // browser not supports input[type="time"]
            var element = $('<span></span>').addClass('timePicker');

            var hourSelect = $('<select></select>').addClass('HH');
            hourSelect.append('<option value="HH">HH</option>');
            for (var i = 0; i <= 23; i++) {
                val = i < 10 ? "0" + i : i;
                hourSelect.append('<option value="' + val + '">' + val + '</option>');
            }
            var minuteSelect = $('<select></select>').addClass('MM');
            minuteSelect.append('<option value="MM">MM</option>');
            for (var i = 0; i <= 59; i++) {
                val = i < 10 ? "0" + i : i;
                minuteSelect.append('<option value="' + val + '">' + val + '</option>');
            }

            $([hourSelect, minuteSelect]).each(function() {
                $(this).change(function() {
                    var HH = $(this).parent().children('.HH').val();
                    var MM = $(this).parent().children('.MM').val();
                    if (parseInt(HH, 10) > 0 && parseInt(MM, 10) > 0) {
                        var time = HH + ':' + MM;
                        $(this).parent().children('input').val(time);
                    } else {
                        $(this).parent().children('input').val("");
                    }
                });
            })
            
            element.append(hourSelect);
            element.append('<span class="separator">:</span>');
            element.append(minuteSelect);

            // fill combos with populate data
            $(input).on('input',function() {
                var val = $(this).val();
                var HH = val.substring(0,2)
                var MM = val.substring(3,5)
                // valid hour
                if (parseInt(HH,10) >= 0 && parseInt(HH,10) <= 23 &&
                    parseInt(MM,10) >= 0 && parseInt(MM,10) <= 59) {
                    $(this).siblings('select.HH').val(HH);
                    $(this).siblings('select.MM').val(MM);
                }
            });

            element.append(input);

            return element;
        } else {
            return input;
        }
    }

    /**
     * Create FILE element
     * 
     * @param {Object} config returns {Object}
     */
    function createFileElm(config) {
        var input = $('<input></input>').attr('type', 'file');

        // .. field attributes
        if (config.name) {
            input.attr('name', config.name);
            input.attr('id', config.name);
        }

        if (config.maxlength) {
            input.attr('size', config.maxlength);
        }

        return input;
    }

    /**
     * Create select menu elements
     * 
     * @param {Object} config
     * @returns {Object}
     */
    function createMenuElm(config) {
        var select = $('<select></select>').attr('name', config.name);

        var opts = config.filter.split('|'), first = null;

        // .. first option (custom)
        if (config.value) {
            opts.unshift(config.value);

            first = true;
        }

        // .. select options
        for (var i = 0; i < opts.length; i++) {
            var value = opts[i];

            var option = $('<option>' + value + '</option>');

            if (!first) {
                option.attr('value', value);
            } else {
                first = null;
            }

            if (value == config.value) {
                option.prop('selected', true);
            }

            select.append(option);
        }

        if (config.required == 1 || config.required == 'true') {
            select.prop('required', true);
        }

        return select;
    }

    /**
     * Create RADIO button elements
     * 
     * @param {Object} config
     * @returns {Object}
     */
    function createRadioElm(config) {
        var div = $('<div></div>').addClass('radios');

        var opts = config.filter.split('|');

        for (var i = 0; i < opts.length; i++) {
            var value = opts[i];

            var subdiv = $('<div></div>').addClass('radio');

            var input = $('<input></input>').attr({
                type : 'radio',
                name : config.name,
                value : value
            });

            if (value == config.value) {
                input.prop('checked', true);
            }

            var span = $('<span>' + value + '</span>');

            subdiv.append(input);
            subdiv.append(span);

            div.append(subdiv);
        }

        return div;
    }

    /**
     * Create CHECKBOX elements
     * 
     * @param {Object} config
     * @returns {Object}
     */
    function createCheckBoxElm(config) {
        var span = $('<div></div>').addClass('checkboxDiv');

        var div = $('<div></div>').addClass('checkbox');

        var input = $('<input></input>').attr({
            type : 'checkbox',
            name : config.name,
            id : config.name,
            value : config.value
        });

        if (config.checked == "true" || config.checked == true) {
            input.prop('checked', true);
        }

        if (config.required == 1 || config.required == 'true') {
            input.prop('required', true);
        }

        span.append(input);
        span.append(div);

        if (config.label) {
            var label = $('<label>' + config.label + '</label>')
            label.attr('for', config.name);
            span.append(label);
        }

        return span;
    }

    /**
     * Create textarea elements
     * 
     * @param {Object} config
     * @returns {Object}
     */
    function createTextAreaElm(config) {
        var textarea = $('<textarea></textarea>')
                            .attr('name', config.name)
                            .attr('id', config.name);

        if (config.required == 1 || config.required == 'true') {
            textarea.prop('required', true);
        }

        if (config.placeholder) {
            textarea.prop('placeholder', config.placeholder);
        }

        if (config.textalign) {
            textarea.css('textAlign', config.textalign);
        }

        if (config.maxlength) {
            textarea.attr('maxlength', config.maxlength);
        }

        return textarea;
    }

    /**
     * Create RANGE element
     * @param {Object} config
     * @returns {Object}
     */
    function createRangeElm(config) {
        var input = $('<input></input>');

        if (Modernizr.inputtypes.range && !(Utils.isAndroid() && Utils.androidVersion() < 4.4)) {
            var input = $('<input></input>');

            // .. field attributes
            if (config.type) {
                input.attr('type', config.type);
            }

            if (config.name) {
                input.attr('id', config.name);
                input.attr('name', config.name);
            }

            if (config.value) {
                input.attr('value', config.value);
            } else {
                input.attr('value', config.min ? config.min : '0');
            }

            if (config.max) {
                input.attr('max', config.max);
            }

            if (config.min) {
                input.attr('min', config.min);
            }

            if (config.step) {
                input.attr('step', config.step);
            }

            var rangeValue = $('<div>' + (config.value ? config.value : '') + '</div>');
            rangeValue.addClass('rangeValue');
            input.after(rangeValue);
            
            // 'input' event works better than 'change' for this 
            input.on('input', function() { 
                var id = $(this).attr('id');
                $('#' + id + ' + .rangeValue').html($(this).val());
            });

        } else {
            // browser not supports input[type="range"]
            input.attr('type', 'number');

            if (config.name) {
                input.attr('id', config.name);
                input.attr('name', config.name);
            }

            if (config.value) {
                input.attr('value', config.value);
            } else {
                input.attr('value', config.min ? config.min : '0');
            }

            if (config.max) {
                input.attr('max', config.max);
            }

            if (config.min) {
                input.attr('min', config.min);
            }
        }

        return input;
    }
    
    

    /**
     * Create validator for element
     * @param {Object} elm
     * @param {Object} config
     */
    function createElementValidator(elm, config) {
        elm.data({
            regex : config.filter,
            mesg : config.error,
            required : config.required,
            error : false
        });

        // attach field events
        elm.on('focusout', function() {
            validateField(this);
            setButtonState($('form'));
        });

        elm.on('keyup', function(event) {
            // tab key
            if (event.keyCode == 9) {
                validateField(this);
            } else {
                // delete keys
                if ((event.keyCode == 8 || event.keyCode == 46)
                        && (!elm.val() || elm.val() == "")) {
                    validateField(this);
                }
            }
            setButtonState($('form'));
        });
    }

    // ---------------------------------------------------------------------------------------------
    // Form validators

    /**
     * Validate the form element value
     * @param {Object} elm
     * @returns {Boolean}
     */
    function validateField(elm) {
        var $this = $(elm);

        var regex = $this.data('regex'), 
            error = $this.data('error'), 
            mesg = $this.data('mesg'), 
            required = $this.data('required');

        var value = elm.value;
        if (!value || value == "") {
            if (required != 1) {
                $this.removeClass('error_input');
                $this.siblings('.errorLabel').removeClass('errorLabel');
                var p = $this.next('p.error_mesg');
                $this.data('error', false);
                p.fadeOut('slow', function() {
                    $this.removeClass('error_on');
                    p.remove();
                });
            }
            return;
        }

        var search = new RegExp(regex), match = null;

        // .. REGEX by type
        switch (elm.nodeName) {
        case 'INPUT':
            match = search.test(value);
            break;

        case 'SELECT':
            match = search.test(value);
            break;

        case 'TEXTAREA':
            match = search.test(value);
            break;
        }

        if (elm.max) {
            if (parseInt(elm.value, 10) > parseInt(elm.max, 10)) {
                match = false;
            }
        }
        if (elm.min) {
            if (parseInt(elm.value, 10) < parseInt(elm.min, 10)) {
                match = false;
            }
        }

        // toggle the error message visibility
        if (match === false && error === false) {
            var p = $('<p>' + mesg + '</p>').addClass('error_mesg');

            $this.addClass('error_input');

            $this.siblings('label').addClass('errorLabel');

            // .. arrow elements
            var span1 = $('<span></span>'), span2 = $('<span></span>');

            span1.addClass('arrow_lft');
            span2.addClass('arrow_rgt');

            p.prepend(span1).append(span2);

            $this.after(p);

            $this.addClass('error_on').data('error', true);

            p.fadeIn('slow');
        } else if ((match === true && error === true)) {
            $this.removeClass('error_input');
            $this.siblings('.errorLabel').removeClass('errorLabel');
            var p = $this.next('p.error_mesg');
            $this.data('error', false);
            p.fadeOut('slow', function() {
                $this.removeClass('error_on');
                p.remove();
            });
        }

        return true;
    }

    /**
     * Enable/Disable submit button
     * @param {Object} form
     */
    function setButtonState(form) {
        var button = form.find('input:submit');
        if (!button)
            return;

        if (errorsExist(form)) {
            button.prop('disabled', true);
        } else {
            button.prop('disabled', false);
        }
    }

    /**
     * Return true if form errors exist
     * @param {Object} form
     * @returns {Boolean}
     */
    function errorsExist(form) {
        var fields = form[0].elements;

        for (var i = 0; i < fields.length; i++) {
            var elm = fields[i];

            // supported elements
            if (!/INPUT|SELECT|TEXTAREA/.test(elm.nodeName)) {
                continue;
            }

            // do errors exist?
            if ((elm.required && !elm.value) || $(elm).data('error')) {
                return true;
            }
        }
    }
    
})(jQuery);