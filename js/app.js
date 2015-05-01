

angular.module('app',['ui.router', 'app.controllers', 'app.directives', 'app.services','ngTagsInput','ngSocial', 'toaster','ngSanitize','angular-google-analytics'])

	.config(['$locationProvider','$stateProvider', '$urlRouterProvider','AnalyticsProvider',function($locationProvider,$stateProvider, $urlRouterProvider,AnalyticsProvider){

		AnalyticsProvider.setAccount('UA-44036434-6');
		
		$stateProvider
			.state('snippets',{
				url: "/"
			})
			.state('snippets.new',{
				url: "snippet/new"
			})
			.state('snippets.single',{
				url: "snippet/{id:[0-9]+}"
			})
			.state('snippets.single.editor',{
				url: "/edit"
			})
			;

		$urlRouterProvider.otherwise('/');


		$locationProvider.html5Mode(!0).hashPrefix("!");
	}]);