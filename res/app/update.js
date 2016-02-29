// Update Widget

function versionCompare(c, d) {
    if (typeof c + typeof d != 'stringstring') return false;
    var a = c.split('.'),
        b = d.split('.'),
        i = 0,
        len = Math.max(a.length, b.length);
    for (; i < len; i++) {
        if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
            return 1;
        } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
            return -1;
        }
    }
    return 0;
}

m.models.Updater = Backbone.Model.extend({
    parse: function(resp) {
        this.set({'homepage': resp.homepage, 'ver': resp.ver, 'download': resp.download});
    }
});

m.collect.Updater = Backbone.Collection.extend({
    model: m.models.Updater,
    url: 'https://raw.githubusercontent.com/0x84/osx-momentum/master/version.js',
    parse: function(resp) { return  resp; }
});

m.views.Updater = Backbone.View.extend({
    attributes: {id: 'updater', class: 'updater'},
    template: Handlebars.compile($("#updater-template").html()),
    initialize: function() {this.render();},
    render: function() {
        var curr_ver = ($("script[src*='update']").attr('src').split('v=')[1]),
            data = this.collection.at(0);

        var variables = {
            curr_ver: curr_ver,
            has_new: (versionCompare(data.get("ver"), curr_ver) > 0 ? true : false),
            new_ver: data.get("ver"),
            homepage: data.get("homepage"),
            download: data.get("download")
        };
        this.$el.appendTo("#"+this.options.region).html(this.template(variables));
    }
});
