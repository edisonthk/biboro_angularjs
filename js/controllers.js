'use strict';

angular.module('app.controllers',[])
	.controller('MyController', ['$scope','$rootScope','$state', '$stateParams','Snippet','User',function(scope, rootScope, state, stateParams, Snippet,User){

		scope.global = {};
		scope.global.state = state;


		scope.snippets = Snippet.query();
		scope.modify_button_title = "編集";
		scope.flag_editing = false;
		scope.errors = null;
		scope.snippet = initialSnippet();
		scope.user = User;
		

		// $scope.$watch(function(){
		// 	return $scope.kw;
		// }, function() {
		// 	console.log($scope.kw);
		// });
		scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			if(toParams.id){

				if(isEditorPage()){
					// 
					// state: editor page
					// =========================
					scope.errors = null;
					scope.modify_button_title = "更新";
					scope.editor_state = 'editor_state';
				}else{
					scope.modify_button_title = "編集";
					scope.editor_state = '';
				}
				// 
				// state: snippets.single
				// =========================
				Snippet.get({snippetId: toParams.id}, function(data) {
					scope.snippet = filterServerSnippet( data );
				});

			}
		});

		scope.loginedCallback = function(results) {
			if(results.error) {
				// show error message
			}else{
				location.reload();
			}
		};

		scope.loadTags = function(q){

		};

		scope.cancelSnippetEvent  = function(snippet_id) {
			state.go('snippets.single',{id: snippet_id});
		};

		scope.modifySnippetEvent = function(snippet_id) {
			if(isEditorPage()) {
				// save

				var _tags = [];
				for (var i = 0; i < scope.snippet.tags.length; i++) {
					_tags.push(scope.snippet.tags[i].text);
				};

				var _data = {
					title: scope.snippet.title,
					content: scope.snippet.content,
					tags: _tags,
				};

				Snippet.update({snippetId: snippet_id}, _data, function(results) {
				
					scope.errors = null;
					scope.snippet = filterServerSnippet(results);
					state.go('snippets.single',{id: snippet_id});	
				
					
				}, function(results){
					// failed to update
					scope.errors = [];
					for(var type in results.data.error) {
						scope.errors.push(results.data.error[type][0]);
					}

					console.log(err);
				});

			}else{
				state.go('snippets.single.editor',{id: snippet_id});
			}
		};

		scope

		scope.logoutCallback = function() {
			// when logout event is successfully carried out
			// this event will be fired
			location.reload();
		};

		scope.logoutEvent = function() {
			User.logout(scope.logoutCallback);
		};

		scope.destroySnippetEvent = function(snippet_id) {

			scope.dialogBox = {
				show: true,
				okButtonText: "削除",
				noButtonText: "キャンセル",
				title: "削除",
				message: "\""+scope.snippet.title+"\"を削除しますか？この動作は戻せないのでご注意ください。",
				okButtonClickEvent: function() {
					Snippet.delete({snippetId: scope.snippet.id}, {} , function(){
						// success to delete snippet
						scope.snippets = Snippet.query();	

						scope.snippet = initialSnippet();
						scope.dialogBox.show = false;
						state.go('snippets');

					}, function(e){
						// failed to delete snippet
						scope.dialogBox.title = "<span class='error-message'><i class='fa fa-close error-message'></i>&nbsp;削除失敗</span>"
						scope.dialogBox.message = "\""+scope.snippet.title+"\"が削除できません。理由は"+e.data.error;

					});
				},
				noButtonClickEvent: function() {
					scope.dialogBox.show = false;
				},
			}
		
		};

		scope.loginEvent = loginEvent;

		var isEditorPage = function() {
			return state.is('snippets.single.editor') || state.is('snippets.new');
		};

	}])
	.controller('EditorController', ['$scope','Snippet',function(scope, Snippet){
		// console.log(scope.snippet);
	}]);

// convert datatype stored in database to client AngularJS
var filterServerSnippet = function(_snippet) {
	var _tags = [];
	for (var i = 0; i < _snippet.tags.length; i++) {
		_tags.push({text: _snippet.tags[i].name});
	};
	_snippet.tags = _tags;

	return _snippet;
}

var loginIntervalId;
var loginEvent = function(cb) {
	
	var win = window.open("/account/signin", "_blank", "width=800, height=600,modal=yes");
	loginIntervalId = setInterval(function() {
		try{
			var url = win.document.URL;
			console.log(url);
			if(url.indexOf("/account/oauth2callback") >= 0){

				var results = {};

				// oauth
				var _tmp = url.split("?");
				if(_tmp.length > 1){
					// have query parameters

					var query_string = _tmp[1].split("&");
					for (var i = 0; i < query_string.length; i++) {
						var __tmp = query_string[i].split("=");
						var key = __tmp[0];
						var val = __tmp[1];

						if(key === "error"){
							results.error = val;
							// console.log(val);
							cb(results);

							win.close();
							clearInterval(loginIntervalId);
						}
					};
				}
			}else if(url.indexOf("/account/success") >= 0){
				
				cb({});

				win.close();
				clearInterval(loginIntervalId);
			}
		}catch(err){
			console.log(err);
		}
	}, 1000);
};

var logoutEvent = function(cb) {

};

var initialSnippet = function() {
	return {
		title: "",
		content: "",
		tags: []
	};
}

var modifySnippetEvent = function(snippet_id) {

};

var destroySnippetEvent = function(snippet_id) {

};
