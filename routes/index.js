var fs = require('fs');
var im = require('imagemagick');
var buffer = require('buffer');
var mkdirp = require('mkdirp');

var $BASEPATH = 'public/files/';
var $FORMATS = 'jpg,gif,png,psd,ai,pdf';

var folders;
var currentPath = $BASEPATH;
var isBack = false;
var currentPathName;
var imageFiles = [];

exports.index = function(req, res){
    getFolders(req, res);
    getImagesOfCurrentPath(res);
};

exports.view = function(req, res) {
    var file = req.param('path');
    var path = file.split('/');
    var fileName = path[path.length - 1];
    var fileExtension = fileName.split('.');
    fileExtension = fileExtension[ fileExtension.length - 1 ];
    path = file.substring(0, file.indexOf(fileName));
    var fileTitle = fileName.substring(0, fileName.indexOf('.' + fileExtension));

    mkdirp('public/cache/big' + path, function(err) {
        if (err) throw err;

        fs.exists('public/cache/big' + path + fileTitle + '.jpg', function (exists) {
            if (!exists) {
                im.convert([currentPath + fileName + '[0]', 'public/cache/big' + path + fileTitle + '.jpg'],
                function(err, stdout){
                    if (err) throw err;
                    res.render('view', {
                        path : path,
                        name : fileTitle,
                        file : file,
                        extension : fileExtension
                    });
                });
            } else {
                res.render('view', {
                    path : path,
                    name : fileTitle,
                    file : file,
                    extension : fileExtension
                });
            }
        });
    });
};

exports.download = function(req, res) {
    var file = req.param('path');
    res.download($BASEPATH.substring(0, $BASEPATH.length - 1) + file);
};

var getFolders = function(req, res) {
    folders = [];

    if (req.param('path') != undefined) {
        currentPath = req.param('path') + '/';

        if (currentPath.substring(0, $BASEPATH.length) !== $BASEPATH) {
            res.redirect('/?path=' + $BASEPATH.substring(0, $BASEPATH.length - 1));
        }
    }

    fs.realpath(currentPath, null, function (err, resolvedPath) {
        if (err) throw err;
        resolvedPath += '/';

        currentPath = resolvedPath.substring(resolvedPath.indexOf($BASEPATH), resolvedPath.length);
        currentPathName = currentPath.substring($BASEPATH.length - 1, currentPath.length);

        isBack = (currentPath !== $BASEPATH);
    });

    fs.readdir(currentPath, function(err, files) {
        files.forEach(function(file) {
            var path = currentPath + file;

            fs.stat(path, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    folders.push(file);
                }
            });
        });
    });
};

var getImagesOfCurrentPath = function(res) {
    var path = currentPath.substring($BASEPATH.length - 1, currentPath.length)

    mkdirp('public/cache/thumb' + path, function (err) {
        if (err) throw err;
    });

    fs.readdir(currentPath, function(err, files) {
        var totalFiles = 0;
        var imageFiles = [];

        files.forEach(function(file) {
            var fileSplit = file.split('.');
            var fileExtension = fileSplit[ fileSplit.length - 1 ];
            var fileName = file.split('.' + fileExtension)[0];

            if ($FORMATS.split(fileExtension).length > 1) {
                totalFiles++;

                fs.exists('public/cache/thumb' + path + fileName + '.jpg', function (exists) {
                    if (!exists) {
                        im.convert([currentPath + file + '[0]', '-resize', '160x160', 'public/cache/thumb' + path + fileName + '.jpg'],
                        function(err, stdout){
                            if (err) throw err;
                            imageFiles.push({
                                src : file,
                                name : fileName,
                                extension : fileExtension
                            });
                        });
                    } else {
                        imageFiles.push({
                            src : file,
                            name : fileName,
                            extension : fileExtension
                        });
                    }
                });
            }
        });

        var check = setInterval(function(){
            if (totalFiles === imageFiles.length) {

                res.render('index', {
                    isBack : isBack,
                    currentPathName : currentPathName,
                    currentPath : currentPath,
                    imageFiles : imageFiles,
                    folders : folders
                });
                clearInterval(check);
            }
        }, 100);
    });
}
