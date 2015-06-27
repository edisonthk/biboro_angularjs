'use strict';

var user_info_in_factory = null;

angular.module('app.services', ['ngResource','ngCookies'])
    .factory('FileUploader', ['$http','$cookies',function($http,$cookies) {

        var maxSize = 1000000;

        return {
            setMaximumSize: function(maximumSize) {
                maxSize = maximumSize;
            },
            upload: function(url, method, files, cb) {

                if(typeof cb !== 'function') {
                    cb = function() {};
                }

                var formData = new FormData();
                for (var i = 0; i < files.length; i++) {
                    if(files[i].size > maxSize) {
                        var data = {
                            errors : "ファイルサイズは1MB以下になります",
                        };

                        cb(false, data, 413);
                        return;  
                    }
                    formData.append('files[]', files[i]);
                }
                    
                var xhr = new XMLHttpRequest();
                xhr.open(method.toUpperCase(), url);
                xhr.setRequestHeader('X-XSRF-TOKEN',$cookies['XSRF-TOKEN'])
                xhr.onreadystatechange = function () {
                    if(xhr.readyState === 4) {
                        var res = xhr.responseText
                        try{
                            var data = JSON.parse(res);
                            if (xhr.status === 200) {
                                cb(true, data, 200);
                            } else {
                                // failed to uploaded
                                cb(false, data, xhr.status);
                            }
                        }catch(err) {
                            console.error(err);
                        }
                    }
                };

                
                xhr.send(formData);
            }   
        };
    }])
    .factory('Snippet', ['$resource', function($resource){

        var queryParams = {snippetId: ''},
            suffix = '';

        if(debug) {
            queryParams.snippetId = 'index';
            suffix = '.json';
        }else{

        }

      	// using $resource module
      	// more details on https://docs.angularjs.org/api/ngResource/service/$resource
      	return $resource('/json/snippet/:snippetId'+suffix, {}, {
          query: {method:'GET', params:queryParams, isArray:true},
          get: {method:'GET'},
          getCreate: {method: 'GET', url: '/json/snippet/create'}, 
          getEdit: {method: 'GET', url:'/json/snippet/:snippetId/edit'},
          update: {method:'PUT'},
          create: {method: 'POST', url:'/json/snippet/'},
          draft: {method:'PUT', url:'/json/snippet/draft/:snippetId'},
          delete: {method: 'DELETE'}
        });

    }])
    .factory('Feedback', ['$resource', function($resource){
      return $resource('/json/feedback', {}, {
        send: {method: 'POST'}
      });
    }])
    .factory('User', ['$http', function($http) {

      this._load = function() {
        $http.get('/account/userinfo').success(function(data){
          // check if data is empty 
          if(data.email && data.id && data.name) {
            user_info_in_factory = data;
            user_manager.info = user_info_in_factory;
            user_manager.logined = true;
          }else{
            user_info_in_factory = null;
          }
        });
      } 

      if(user_info_in_factory == null) {
        this._load();
      }

      var user_manager = {};
      if(user_info_in_factory != null) {
        user_manager.info = user_info_in_factory;
        user_manager.logined = true;
      }else{
        user_manager.info = null;
        user_manager.logined = false;        
      }

      user_manager.refresh = function() {
        this._load();
      };
      user_manager.logout = function(cb) {
        var _t = this;
        $http.get('/account/signout').success(function(data){
          _t.info = null;
          _t.logined = false;
          user_info_in_factory = null;
          if(typeof cb === 'function') {
            cb();  
          }
          
        });
      }

      return user_manager;
    }])
    ;