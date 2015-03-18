'use strict';

var Converter = new Showdown.converter();

angular.module('app.controllers',[])
	.controller('MyController', ['$scope','$rootScope','$state', '$stateParams','Snippet',function(scope, rootScope, state, stateParams, Snippet){

		scope.snippets = Snippet.query();

		scope.snippet = {
			content: "",
		};
		

		// $scope.$watch(function(){
		// 	return $scope.kw;
		// }, function() {
		// 	console.log($scope.kw);
		// });
		scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			if(toParams.id){
				// 
				// state: snippets.single
				// =========================
				Snippet.get({snippetId: toParams.id}, function(data) {
					scope.snippet.content = Converter.makeHtml(data.content);	
					console.log(scope.snippet.content);
				});
				

			}
		});

	}]);