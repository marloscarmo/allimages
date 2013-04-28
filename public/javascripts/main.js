require.config({
    paths: {
        jquery: '../javascripts/jquery.min',
        bootstrap: '../components/bootstrap/bootstrap.min'
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        }
    }
});

require(['app', 'jquery', 'bootstrap'], function (app, $) {
    'use strict';
});