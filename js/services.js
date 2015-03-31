'use strict';

var user_info_in_factory = null;

angular.module('app.services', ['ngResource'])
    .factory('Snippet', ['$resource', function($resource){

      	// using $resource module
      	// more details on https://docs.angularjs.org/api/ngResource/service/$resource
      	return $resource('/json/snippet/:snippetId', {}, {
          query: {method:'GET', params:{snippetId:''}, isArray:true},
          get: {method:'GET'},
          update: {method:'PUT'},
          create: {method: 'POST', url:'/json/snippet/'},
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