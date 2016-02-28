// Quote widget


// Models

m.models.ShortQuote = Backbone.Model.extend({
    parse: function(response) {
        this.set({ body: response.body, source: response.source });
    }
});


// Collections

m.collect.ShortQuotes = Backbone.Collection.extend({
    model: m.models.ShortQuote,
    url: 'app/quotes.json',
    parse: function (response) {
        return response.quotes;
    }
});


// Views

m.views.ShortQuote = Backbone.View.extend({
    tagName: 'blockquote',
    attributes: { id: 'shortquote' },
    template: Handlebars.compile( $("#shortquote-template").html() ),
    initialize: function () {
        this.render();
        this.listenTo(m, 'newDay', this.loadNewQuote, this);
    },
    render: function () {
        var that = this;
        var index = window.localStorage['shortquote'];
        if (!index || Number(index)+1 > this.collection.length) {
            index = this.getNewIndex();
        }
        window.localStorage['shortquote'] = index;
        var body = this.collection.at(index).get('body');
        var source = this.collection.at(index).get('source');

        var variables = { body: body, source: source };
        var order = (this.options.order  || 'append') + 'To';

        that.$el[order]('#' + that.options.region).html(that.template(variables));
    },
    loadNewQuote: function () {
        window.localStorage['shortquote'] = this.getNewIndex();
        this.render();
    },
    getNewIndex: function () {
        var currentIndex = localStorage.shortquote;
        var quotes = JSON.parse(localStorage.quotes || "[]");
        if (quotes.length === 0) {
            quotes = Object.keys(m.collect.shortquotes.models);
        }
        var newIndex = Math.floor(Math.random()*quotes.length);
        while (currentIndex === newIndex) {
            newIndex = Math.floor(Math.random()*quotes.length);
        }
        var newQuote = quotes.splice(newIndex, 1);
        localStorage.quotes = JSON.stringify(quotes);
        return newQuote;
    }
});
