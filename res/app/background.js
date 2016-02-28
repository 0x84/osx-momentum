// Background feature


// Models

m.models.Background = Backbone.Model.extend({
    parse: function(response) {
        this.set({ 'filename': response.filename, 'title': response.title, 'source': response.source, 'sourceUrl': response.sourceUrl, 'shutterstockPromo': response.shutterstockPromo, 'impressionUrl': response.impressionUrl });
    }
});


// Collections

m.collect.Backgrounds = Backbone.Collection.extend({
    model: m.models.Background,
    url: 'app/backgrounds.json',
    parse: function (response) {
        return response.backgrounds;
    }
});


// Views

m.views.Background = Backbone.View.extend({
    tagName: 'li',
    attributes: {  },
    // JO: Testing setting background without a template
    //template: Handlebars.compile( $("#background-template").html() ),
    initialize: function () {
        this.render();
        this.listenTo(m, 'newDay', this.loadNewBg, this);
    },
    render: function () {
        var that = this;
        var index = window.localStorage['background'];
        if (!index || Number(index)+1 > this.collection.length) {
            localStorage.backgrounds = '[]';
            index = this.getNewIndex();
        }
        // make sure shutterstock promo only shows US on update
        var background = m.collect.backgrounds.at(index);
        if (background.attributes.shutterstockPromo === true && localStorage.country !== 'US') {
            localStorage.backgrounds = '[]';
            index = this.getNewIndex();
        }

        window.localStorage['background'] = index;
        var filename = this.collection.at(index).get('filename');
        var title = this.collection.at(index).get('title');
        var source = this.collection.at(index).get('source');
        var sourceUrl = this.collection.at(index).get('sourceUrl');
        var order = (this.options.order || 'append') + 'To';
//        var impressionUrl = this.collection.at(index).get('impressionUrl');


        // JO: Hack to get the backgrounds to fade between each other; replace with background subviews and separate LIs
        $('#background').css('background-image',$('#background').find('li').css('background-image'));

        // JO: Make sure the background image loads before displaying (even locally there can be a small delay)
        $('<img/>').attr('src', 'backgrounds/' + filename).load(function() {
            that.$el[order]('#' + that.options.region).css('background-image','url(backgrounds/' + filename + ')').addClass('fadein');
            $(this).remove();
            $('.widgets').addClass('fadein');
            $('.background-overlay').addClass('fadein');
        });

        // JO: Render Background Info subview
        this.backgroundInfo = new m.views.BackgroundInfo({ region: 'bottom-left', title: title, source: source, sourceUrl: sourceUrl });
        var order = (this.backgroundInfo.options.order  || 'append') + 'To';
        $('#background-info').remove();
        this.backgroundInfo.render().$el[order]('#' + this.backgroundInfo.options.region);

        // Shutterstock tracking pixel
//        if (impressionUrl) {
//            $('body').append('<img src="'+impressionUrl+'">');
//        }
    },
    loadNewBg: function () {
        // attempting to solve the race condition where multiple tabs are open
        var now = new Date();
        var backgroundUpdate = new Date(localStorage.backgroundUpdate);

        if (Date.parse(now) > Date.parse(backgroundUpdate) || !m.isValidDate(backgroundUpdate)) {
            localStorage.backgroundUpdate = now;
            var index = this.getNewIndex();
            localStorage.background = index;
        }
        this.render();
    },
    getNewIndex: function () {
        var currentIndex = localStorage.background;
        var backgrounds = JSON.parse(localStorage.backgrounds || "[]");

        // Get new background index from background that isn't the current one
        var newBackground = null;
        while (newBackground === null || Number(newBackground)+1 > this.collection.length) {

            // Repopulate backgrounds array if new or empty
            if (backgrounds.length === 0) {
                backgrounds = Object.keys(m.collect.backgrounds.models);
            }

            var newIndex = Math.floor(Math.random()*backgrounds.length);

            // Ensure we don't get duplicate image when we regenerate backgrounds buffer array
            while (currentIndex === newIndex) {
                newIndex = Math.floor(Math.random()*backgrounds.length);
            }

            // Cut the chosen background out of the backgrounds array
            newBackground = backgrounds.splice(newIndex, 1)[0];
        }

        // Save the modified backgrounds array
        localStorage.backgrounds = JSON.stringify(backgrounds);

        // If we aren't in the US, need to make sure that we don't get
        // a promo photo.
        var background = m.collect.backgrounds.at(newBackground);
        if (background.attributes.shutterstockPromo === true && localStorage.country !== 'US') {
            var newBackground = this.getNewIndex();
        }

        return newBackground;
    }
});

m.views.BackgroundInfo = Backbone.View.extend({
    tagName: 'div',
    attributes: { id: 'background-info', class: 'light' },
    template: Handlebars.compile($("#background-info-template").html()),
    events: {
        "mouseenter": "handleHover",
        "click .source-url": "trackClick"
    },
    initialize: function () {
    },
    render: function () {
        var title = this.options.title;
        if (!title) {
            title = "";
            this.$el.addClass('title-unknown');
        }
        var source = this.options.source
        if (!source) {
            source = "";
            this.$el.addClass('source-unknown');
        }
        var sourceUrl = this.options.sourceUrl;
        var variables = { title: title, source: source, sourceUrl: sourceUrl };
        this.$el.html(this.template(variables));

        return this;
    },
    handleHover: function() {
        ga('send', 'event', 'BackgroundInfo', 'Hover');
    },
    trackClick: function() {
        ga('send', 'event', 'BackgroundInfo', 'Click', localStorage.background);
    }
});

