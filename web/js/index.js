'use strict';

// Used to call functions from the main process
const {ipcRenderer} = require('electron');
const {clipboard} = require('electron');

/**
* Pocket Module
*
* Description
*/
angular.module('pocket', ['lrInfiniteScroll', 'selectize', 'ngSanitize'])
.controller('PocketController', function($scope, pocketService){
  var pocket = this;
  let webview = document.querySelector('#webview');
  // auxiliar variable to check if the term searched changed
  let searched = '';
  let selectizeObj = false;

  // sidebar items
  pocket.sidebarItems = [];

  // flag used to check if it search or not
  pocket.searching = false;

  // flag used in front to check if it's making a request
  pocket.busy = false;

  // form fields
  pocket.item_title = '';
  pocket.item_url = '';
  pocket.item_tags = '';

  pocket.tags = '';
  pocket.tags_item_id = '';

  pocket.selectize = {
    tags: '',
    options: '',
    config: {
      create: true,
      plugins: ['remove_button'],
      placeholder: 'Tags',
      delimiter: ',',
      persist: false,
      onInitialize: function(selectize){
        // persist selectize object through controller
        selectizeObj = selectize
      }
    }
  };

  // it's used $scope because of the plugin lrInfiniteScroll
  $scope.moreItems = function() {
    if (pocket.busy) return;

    // calls search action
    if (pocket.searching) {
      pocket.search();
      return;
    }

    pocket.busy = true;

    // calls function in main process
    ipcRenderer.send('getItems', {count: 20, offset: pocket.sidebarItems.length});

    // receives data from the main process
    pocketService.retrieveLater('retrieveItems').then(function(data) {

      pocket.busy = false;

      // adds items
      let length = data.length
      for (let i = 0; i < length; i++) {
        // if (pocket.sidebarItems.includes(data[i].item_id)) {
          pocket.sidebarItems.push(data[i]);
        // }
      }
    });
  };

  // Calling the first time
  $scope.moreItems();

  // search action
  pocket.search = function() {
    if (pocket.busy) return;

    if (pocket.searchText == '') {
      pocket.cleanSearch();
      return;
    }

    if (pocket.searching == false
        || (pocket.searching && searched != pocket.searchText)) {
      pocket.sidebarItems = [];
    }

    pocket.busy = pocket.searching = true;

    searched = pocket.searchText;

    // calls function in main process
    ipcRenderer.send('getItems', {count: 10, offset: pocket.sidebarItems.length, search: pocket.searchText});

    // receives data from the main process
    pocketService.retrieveLater('retrieveItems').then(function(data) {

      pocket.busy = false;

      let length = data.length
      for (let i = 0; i < length; i++) {
        pocket.sidebarItems.push(data[i]);
      }
    });
  }

  pocket.cleanSearch = function() {
    pocket.searching = false;
    pocket.searchText = searched = '';
    pocket.sidebarItems = [];
    $scope.moreItems();
  }

  // refresh action
  pocket.refresh = function() {
    if (pocket.busy) return;

    pocket.busy = true;

    // calls function in main process
    ipcRenderer.send('getItems', {count: 10, offset: 0, since: true});

    // receives data from the main process
    pocketService.retrieveLater('retrieveItems').then(function(data) {
      pocket.busy = false;

      let length = data.length
      for (let i = 0; i < length; i++) {
        let item = pocket.sidebarItems.find((item) => { return item.item_id === data[0].item_id; });
        if (!item) {
          pocket.sidebarItems.unshift(data[i]);
        }
      }
    });
  }

  // add item
  pocket.addItem = function() {
    // saves item
    ipcRenderer.send('saveItem', {
      url: pocket.item_url,
      title: pocket.item_title,
      tags: pocket.selectize.tags ? pocket.selectize.tags.join(',') : ''
    });

    // adds new item in sidebar
    pocketService.retrieveLater('savedItem').then(function() {

      pocket.busy = true;

      // getting new item
      ipcRenderer.send('getItems', {count: 1, offset: 0});

      // adding new item
      pocketService.retrieveLater('retrieveItems').then(function(data) {
        pocket.busy = false;

        // verifies item in array
        let item = pocket.sidebarItems.find((item) => { return item.item_id === data[0].item_id; });
        if (item) {
          pocket.sidebarItems.splice(item, 1); // removes
        }
        pocket.sidebarItems.unshift(data[0]);

        pocket.item_url = pocket.item_title = pocket.selectize.tags = '';
        document.querySelector('.close-button').click();
      });
    });
  }

  // add and remove favorite flag
  pocket.setFavoriteStatus = function(item) {
    item.favorite = item.favorite == 1 ? 0 : 1;

    // modify item
    ipcRenderer.send('modifyItem', {
      item_id: item.item_id,
      action: item.favorite == 1 ? 'unfavorite' : 'favorite'
    });

    // adds new item in sidebar
    pocketService.retrieveLater('modifiedItem').then(function(status) {
      // if it is not success, rollback
      if (status == 1) return;

      item.favorite = item.favorite == 1 ? 0 : 1;
    });
  }

  // delete an item
  pocket.removeItem = function(item) {
    // modify item
    ipcRenderer.send('modifyItem', {
      item_id: item.item_id,
      action: 'delete'
    });

    // adds new item in sidebar
    pocketService.retrieveLater('modifiedItem').then(function(status) {
      // not success, do nothing
      if (status != 1) return;

      let index = pocket.sidebarItems.indexOf(item);
      if (index > -1) {
        // it removes and replaces
        pocket.sidebarItems.splice(index, 1);
      }
    });
  }

  // archive or not an item
  pocket.archivedItem = function(item) {
    // modify item
    ipcRenderer.send('modifyItem', {
      item_id: item.item_id,
      action: 'archive'
    });

    // adds new item in sidebar
    pocketService.retrieveLater('modifiedItem').then(function(status) {
      // not success, do nothing
      if (status != 1) return;

      let index = pocket.sidebarItems.indexOf(item);
      if (index > -1) {
        // it removes and replaces
        pocket.sidebarItems.splice(index, 1);
      }
    });
  }

  // submit tags
  pocket.addTags = function() {
    ipcRenderer.send('modifyItem', {
      item_id: pocket.tags_item.item_id,
      action: 'tags_replace',
      tags: pocket.selectize.tags
    });

    // @todo tentando fazer o autofocus
    // @todo pensar em uma maneira de invocar janelas built-out do app para cadastro(global shortcut) - tray
    // selectizeObj.

    // adds new item in sidebar
    pocketService.retrieveLater('modifiedItem').then(function(status) {
      // not success, do nothing
      if (status != 1) return;

      // implement others functionalities
      let array_tag = pocket.selectize.tags;
      let length = array_tag.length;
      pocket.tags_item.tags = [];
      for(let i = 0; i < length; i++) {
        pocket.tags_item.tags.push({ tag: array_tag[i] });
      }

      pocket.tags_item = pocket.tags = '';
      document.querySelector('.close-tag').click();
    });
  }

  // adds tags in selectize
  pocket.tagForm = function(item) {
    pocket.tags_item = item;

    pocket.selectize.tags = [];
    for (let tag in item.tags) {
      pocket.selectize.tags.push(item.tags[tag].tag);
    }

    selectizeObj.focus();
  }

  // function to open website
  pocket.showWebview = function(item, event) {
    if (event.ctrlKey || event.metaKey) {
      require('electron').shell.openExternal(item.resolved_url);
      return;
    }
    // loading item URL
    webview.loadURL(item.resolved_url);
  };

  // events from webview
  if (webview)
  webview.addEventListener('did-start-loading', function() {
    $('.indicator').slideDown();
  });

  if (webview)
  webview.addEventListener('did-stop-loading', function() {
    $('.indicator').slideUp();
  });

})
.service('pocketService', function($q) {
  this.retrieveLater = function(responseName) {
    let deferred = $q.defer();

    // waits asyc function
    ipcRenderer.on(responseName, function(event, arg) {
      deferred.resolve(arg);
    });

    // it will return a promise object and then, when the async function return it'll change its value
    return deferred.promise;
  }
})
.directive('autofocus', function(){
  // Runs during compile
  return {
    restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
    link: function($scope, elem, iAttrs, controller) {
      $(elem).on('shown.bs.modal', function () {
        $(elem).focus();
      });
    }
  };
})
.directive('ngConfirmMessage', [function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.on('click', function (e) {
                let message = attrs.ngConfirmMessage || "Are you sure ?";
                if (!confirm(message)) {
                    e.stopImmediatePropagation();
                }
            });
        }
    }
}])
.directive('pasteUrl', [function () {
  return {
    restrict: 'A',
    link: function($scope, element, attrs) {
      let paste = clipboard.readText();
      let pattern = /^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/;
      // checks url
      if (pattern.test(paste)) {
        // paste item url
        $scope.pocket.item_url = paste;
      }
    }
  }
}]);
