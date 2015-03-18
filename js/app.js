

angular.module('app',['ui.router', 'app.controllers', 'app.directives', 'app.services'])

	.config(['$locationProvider','$stateProvider', '$urlRouterProvider',function($locationProvider,$stateProvider, $urlRouterProvider){

		$stateProvider
			.state('snippets',{
				url: "/"
			})
			.state('snippets.single',{
				url: "snippet/:id"
			});

		$urlRouterProvider.otherwise('/');


		// $locationProvider.html5Mode(!0).hashPrefix("!");
	}]);