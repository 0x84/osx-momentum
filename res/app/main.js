// Momentum Dashboard Page Script

m.isValidDate = function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" ) {
        return false;
    }
    return !isNaN(d.getTime());
};

function isFullScreen() {
    return (window.navigator.standalone || window.fullScreen ||
            (document.fullScreenElement && document.fullScreenElement !== null) ||
            (document.mozFullScreen || document.webkitIsFullScreen) ||
            (!window.screenTop && !window.screenY) ||
            (window.innerWidth == screen.width && window.innerHeight == screen.height));
}

function isNewDay(date) {
    var today = new Date(localStorage.today);

    if ((today.getDate() !== date.getDate() && date.getHours() >= 5) || (today.getDate() == date.getDate() && date.getHours() >= 5 && today.getHours() < 5)) {
        return true;
    }

    return false;
}

function isDateInFuture(date) {
    return Date.parse(date) > Date.parse(new Date());
}

function ensureLocalStorageDatesAreValid() {
  var date = new Date();
  var dateKeys = ['today', 'backgroundUpdate'];

  for (var i in dateKeys) {
    var lsDate = new Date(localStorage[dateKeys[i]]);
    if (!m.isValidDate(lsDate) || isDateInFuture(lsDate)) {
//      console.log('resetting ' + dateKeys[i]);
      localStorage[dateKeys[i]] = date;
    }
  }
}

/** Models **/
m.models.Date = Backbone.Model.extend({
    defaults: function () {
        var date = new Date();
        var hour12clock = JSON.parse(localStorage.hour12clock);
        return {
            date: date,
            hour12clock: hour12clock
        };
    },
    initialize: function(){
        this.listenTo(this, 'change:date', this.updateTime, this);
    },
    getTimeString: function(date) {
        var hour12clock = this.get('hour12clock');
        date = date || this.get('date');
        var hour = date.getHours();
        var minute = date.getMinutes();
        var sec = date.getSeconds();
        if (hour12clock === true) {
            hour = ((hour + 11) % 12 + 1);
        }
        if (hour < 10 && !hour12clock) { hour = "0" + hour; }
        if (minute < 10) { minute = "0" + minute; }
        if (sec < 10) { sec = "0" + sec;}
        return hour + ':' + minute + ':' + sec;
    },
    getTimePeriod: function() {
        if (this.get('date').getHours() >= 12) { return 'PM'; } else { return 'AM'; }
    },
    updateTime: function() {
        var now = this.getTimeString();
        if (this.get('time') != now) {
            this.set('time', now);
        }
    }
});


/** Collections **/



/** Views **/

m.views.CenterClock = Backbone.View.extend({
    id: 'centerclock',
    template: Handlebars.compile( $("#centerclock-template").html() ),
    events: {
        "dblclick": "toggleFormat",
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:time', this.updateTime, this);
    },
    render: function () {
        var time = this.model.getTimeString();

        var variables = { time: time };
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html(this.template(variables)).css('opacity', 1);
        this.$time = this.$('.time');
        this.$format = this.$('.format');
        if (this.model.get('hour12clock')) this.$format.addClass('show');
    },
    toggleFormat: function () {
        var hour12clock = !this.model.get('hour12clock');
        this.model.set({ hour12clock: hour12clock });
        localStorage.hour12clock = hour12clock;
        if (hour12clock) {
            setTimeout(function(){
                $('.format').addClass('show');
            }, 40);
            this.$format.html(this.model.getTimePeriod());
        } else {
            $('.format').removeClass('show');
        }
    },
    updateTime: function () {
        this.$time.html(this.model.getTimeString());
    }
});

function setEndOfContenteditable(contentEditableElement) {
    var range, selection;
    if (document.createRange) { //Firefox, Chrome, Opera, Safari, IE 9+
        range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
        range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
    }
}

m.views.Greeting = Backbone.View.extend({
    id: 'greeting',
    template: Handlebars.compile( $("#greeting-template").html() ),
    events: {
        "dblclick .name": "editName",
        "keypress .name": "onKeypress",
        "keydown .name": "onKeydown",
        "blur .name": "saveName",
        "webkitAnimationEnd .name": "onAnimationEnd"
    },
    initialize: function () {
        this.render();
        this.listenTo(this.model, 'change:time', this.updatePeriod, this);
    },
    render: function () {
        var period = this.getPeriod();
        var name = localStorage.name;
        var variables = { period: period, name: name };
        var order = (this.options.order  || 'append') + 'To';

        this.$el[order]('#' + this.options.region).html( this.template(variables) ).fadeTo(500, 1);

        this.$period = this.$('.period');
        this.$name = this.$('.name');
    },
    getPeriod: function () {
        var now = this.model.get('date');
        var hour = now.getHours();
        var period;
        if (hour >= 3 && hour < 12) period = 'morning';
        if (hour >= 12 && hour < 17) period = 'afternoon';
        if (hour >= 17 || hour < 3) period = 'evening';
        return period;
    },
    updatePeriod: function () {
        this.$period.html(this.getPeriod());
    },
    editName: function () {
        if (!this.$name.hasClass('editing')) {
          this.$name.attr('contenteditable', true).addClass('editing pulse').focus();
          setEndOfContenteditable(this.$name.get(0));
        }
    },
    onAnimationEnd: function (e) {
      if (e.originalEvent.animationName === "pulse") {
        this.$name.removeClass('pulse');
      }
    },
    onKeypress: function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
            this.saveName();
        }
    },
    onKeydown: function (e) {
        if (e.keyCode === 27) {
            this.$name.html(localStorage.name); //revert
            this.doneEditingName();
        }
    },
    saveName: function () {
        var newName = this.$name.html();
        if (newName === "") {
          this.$name.html(localStorage.name); //revert
        } else {
          localStorage.name = newName;
        }
        this.doneEditingName();
    },
    doneEditingName: function () {
        this.$name.attr('contenteditable', false).removeClass('editing').addClass('pulse');
    }
});

m.views.Introduction = Backbone.View.extend({
    attributes: { id: 'introduction' },
    template: Handlebars.compile( $("#introduction-template").html() ),
    events: {
        "keypress input": "updateOnEnter"
    },
    initialize: function () {
        this.render();
    },
    render: function () {
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html(this.template()).fadeTo(1000, 1);
    },
    updateOnEnter: function(e) {
        if (e.keyCode == 13) this.save();
    },
    save: function() {
        var name = this.$el.find('input')[0].value;
        localStorage.name = name;
        var that = this;
        this.$el.fadeTo(1000,0, function () {
            that.remove();
            m.appView.render();
        });
    }
});
/*
m.views.AppReturn = Backbone.View.extend({
    events: {
        'click': 'clicked'
    },
    initialize: function () {
        this.render();
    },

    render: function () {
        var content = '<a id="app-return" class="top-nav">Apps</a>'
        var order = (this.options.order  || 'append') + 'To';
        this.$el[order]('#' + this.options.region).html( $.trim(content) ).fadeTo(500, 1);
        return this;
    },
    clicked: function (e) {
        e.preventDefault();
    }
});
*/

// Parent view
m.views.Dashboard = Backbone.View.extend({
    initialize: function () {
        $("html").on('contextmenu', function() {return false;});
        // for screen saver options
        if (!isFullScreen()) {
            $(["bottom"]).each(function(k, v) { $("#"+v).hide(); });
            $(document.body).css({ 'zoom': 0.3 });
        }


        // set up empty localstorage variables for JSON.parse
        // remove this one we get sync set up
        if (!localStorage.hour12clock) {
            localStorage.hour12clock = false;
        }
        // if (!localStorage['momentum-messageRead']) {
        //     localStorage['momentum-messageRead'] = JSON.stringify({ version: "0" });
        // }

        m.models.date = new m.models.Date();

        m.collect.backgrounds = new m.collect.Backgrounds();
        m.collect.backgrounds.fetch({async: false});

        m.views.background = new m.views.Background({
            collection: m.collect.backgrounds,
            model: m.models.date,
            region: 'background'
        });

        if (!localStorage.name) {
            m.views.introduction = new m.views.Introduction({ region: 'center' });
            return;
        }

        this.render();

        window.addEventListener('storage', function (e) {
            switch (e.key) {
                case "background":
                    m.trigger('newDay');
                    break;
            }
        });

        ensureLocalStorageDatesAreValid();

        this.dateIntervalId = setInterval(function () {
            m.models.date.set('date', new Date());
        }, 100);

        this.newDayIntervalId = setInterval(function () {
            var date = m.models.date.get('date');
            if (isNewDay(date)) {
                localStorage.today = date;
                m.trigger('newDay');
            }
            ensureLocalStorageDatesAreValid();
        }, 200);
    },

    render: function () {
        // Load widgets

//        if (m.globals.platform === 'chrome') {
//            m.views.appReturn = new m.views.AppReturn({ region: 'top-left', order: 'prepend' });
//        }        

        m.views.greeting = new m.views.Greeting({ model: m.models.date, region: 'center', order: 'prepend' });
        m.views.centerClock = new m.views.CenterClock({ model: m.models.date, region: 'center', order: 'prepend' });
/*
        m.collect.todos = new m.collect.Todos();
        m.views.todos = new m.views.Todos({ collection: m.collect.todos, region: 'bottom-right', order: 'append' });
        m.views.todosComplete = new m.views.TodosComplete({ collection: m.collect.todos, region: 'top-right', order: 'prepend' });

        m.collect.focuses = new m.collect.Focuses();
        m.collect.focuses.fetch({
            success: function(response, xhr) {
                m.views.focuses = new m.views.Focuses({ collection: m.collect.focuses, model: m.models.date, region: 'center-below', order: 'append' });
            },
            error: function (errorResponse) {
                   console.log(errorResponse)
            }
        });
*/
        m.collect.shortquotes = new m.collect.ShortQuotes();
        m.collect.shortquotes.fetch({
            success: function(response, xhr) {
                m.views.shortQuote = new m.views.ShortQuote({ collection: m.collect.shortquotes, model: m.models.date, region: 'bottom' });
            },
            error: function (errorResponse) {
                console.log(errorResponse);
            }
        });

        m.models.weather = new m.models.Weather({ id: 1 });
        m.models.weather.fetch();
        m.views.weather = new m.views.Weather({ model: m.models.weather, region: 'top-right', order: 'append' });

        if (!isFullScreen()) {
            m.models.updater = new m.models.Updater();
            m.collect.updater = new m.collect.Updater();
            m.collect.updater.fetch({
                success: function(resp, xhr) {
                    m.views.updater = new m.views.Updater({ collection: m.collect.updater, model: m.models.updater, region: 'top-left' });
                },
                error: function(resp) { console.log(resp); }
            });
        }
    }
});


/** Bootstrap **/

$(function() {
    m.appView = new m.views.Dashboard();


    // Send clicks to safari extension so we know to load the link
//    if (m.globals.platform == 'safari') {
//        $('a').on('click', function (e) {
//            safari.self.tab.dispatchMessage("sendClick", {
//                link: this.href,
//                time: (new Date).getTime()
//            });
//        });
//    }


    // Configure Sentry
//    Raven.config('https://c5bd9bde02f94f02ba4bad71eada9a8d@app.getsentry.com/30419').install();

    // Catch unhandled exceptions
    window.onerror = function(msg, url, line, col, error) {
//        Raven.captureMessage(msg, {
//            extra: {
//                message: error.message,
//                stack: error.stack
//            }
//        });
        return true;
    };

    // Catch all failed AJAX requests
    $( document ).ajaxError(function( event, jqxhr, settings, exception ) {
//        Raven.captureMessage('AJAX request has failed!',{
//            extra: {
//                origin: event.target.URL,
//                url: settings.url,
//                method: settings.type,
//                data: settings.data
//            }
//        });
    });

    // Kick off GA
//    ga('create', m.globals.googleAnalyticsCode, 'auto');
//    ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. See http://stackoverflow.com/a/22152353/1958200
//    ga('require', 'displayfeatures');
//    ga('send', 'pageview', '/dashboard.html');
//    ga('send', 'event', 'BackgroundInfo', 'Impression', localStorage.background);
});

//(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
//(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
//m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
//})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

