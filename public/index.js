import Vue from 'vue'
import ClientPocket from './helpers/client'
import 'materialize-css'

/** components */
import itemsView from './component/item.vue'
import formItem from './component/forms/item.vue'
import Modal from './component/modal.vue';

Vue.config.keyCodes.r = 82;
Vue.config.keyCodes.t = 84;
Vue.config.keyCodes.u = 85;
Vue.config.keyCodes.d = 68;
Vue.config.keyCodes.e = 69;

const CONSUMER_KEY = '50966-8ed0e65f1d3925e9055caa1d';
// minutes * seconds * 1000
const FREQ_UPDATE_LIST = 5 * 60 * 1000;

var app = new Vue({
  el: "#app",
  data: {
    searching: false, // initial value to change the searchbar
    formItemModal: false, // modal item add
    loading: false,
    items: [],
    loaded_items: [], // to keep the list of items already loaded
    search: '',
    since: 0,
    client: new ClientPocket()
  },

  mounted: function() {
    /** client configs */
    const {ipcRenderer} = require('electron');

    var _this = this;
    ipcRenderer.on('get_token_user', (e, user_token) => {
      _this.client.setToken(user_token);
      _this.client.setConsumerKey(CONSUMER_KEY);

      /* @task: save the interval in config */
      setInterval(() => {
        _this.updateList();
      }, FREQ_UPDATE_LIST);
      _this.updateList();
    });
    ipcRenderer.send('request_token_user');

    // UI
    $('.menu-side-nav').sideNav();
    $('.dropdown-button').dropdown();
  },

  /** Methods Functions */
  methods: {
    getItem: function() {
      this.loading = true;

      let options = Object.assign({}, {offset: this.items.length}, this.getParsedSearch)

      this.client.getItens(options)
      .then(this.joinItemsToList)
      // transform in seconds
      .then(() => this.since = Date.now()/1000)
      .then(() => this.loading = false)
      .catch(this.client.fullError);
    },

    searchItems: function() {
      // save just the default items
      if (this.loaded_items.length == 0)
        this.loaded_items = this.items;

      this.items = [];
      this.getItem();
    },

    joinItemsToList: function(req) {
      var _this = this;
      let list = req.data.list;

      Object
      .keys(list)
      // sort following the time, because even passing the param it comes wrong
      .sort((x,y) => list[y].time_added - list[x].time_added)
      .map(function(key) {
        _this.items.push(_this.normalizeItems(list[key]));
      });
    },

    // Scrolling function to infinite scroll
    loadMore: function(e) {
      let div = e.srcElement;
      let percentageReload = 70;

      let bottomScroll = div.scrollTop + div.offsetHeight;
      let fullHeight = div.scrollHeight;

      // prevent triggering the function more than once at time
      if (this.loading === false && (bottomScroll * 100 / fullHeight) > percentageReload) {
        this.getItem();
      }
    },

    /** the key */
    goToSearch: function(e) {
      let keyCodeF = 70;

      if (e.keyCode == keyCodeF) {
        this.invokeSearchBar();
      }
    },

    goToList: function() {
      if (this.loaded_items.length > 0) {
        // swap to the default list
        this.items = this.loaded_items;
        this.loaded_items = [];
        this.search = '';
      }

      this.$nextTick(() =>
        this.$el.querySelector('#list_item').firstChild.firstChild.focus()
      );
    },

    updateList: function() {
      // no item, no update
      if (this.items.length == 0)
        return this.getItem();

      var _this = this;

      this.loading = true;

      let options = Object.assign(
        // 100 = random value to try to surpass the api's limitation
        {count: 0, since: this.since - 50},
        this.getParsedSearch
      );

      this.client.getItens(options)
      .then((resp) => {
        let list = resp.data.list;
        return Object
                    .keys(list)
                    .sort((x,y) => list[y].time_added - list[x].time_added)
                    .map(i => _this.normalizeItems(list[i]))
      })
      .then((items) => {
        /**
         * 0 = add
         * 1 = archive
         * 2 = delete
         */

        /** remove from list */
        let deleteItems = items.filter(i => i.status == 1 || i.status == 2).map(i => i.id);
        if (deleteItems.length)
          _this.items.findIndex((elem, index, arr) => {
            if (elem && deleteItems.indexOf(elem.id) != -1) {
              /* delete it */
              _this.items.splice(index, 1);
            }
          });

        /** add/edit */
        items.filter(i => i.status == 0)
            .reverse()
            .map(elem => {
              let index = _this.items.findIndex(e => e && e.id == elem.id);
              if (index == -1) // new item
                _this.items.unshift(elem)
              else // update item
                _this.items.splice(index, 1, elem);
            });
      })
      // transform in seconds
      .then(() => this.since = Date.now()/1000)
      .then(() => this.loading = false)
      .catch(this.client.fullError);
    },

    normalizeItems: function(item) {
      let tags = item.tags ? Object.keys(item.tags) : [];

      return {
        id: item.item_id,
        title: item.given_title ? item.given_title : item.resolved_title,
        url: item.given_url,
        desc: item.excerpt,
        id: item.item_id,
        tags: tags,
        // @task: improve this
        image: item.image ? item.image.src : '',
        added: item.time_added,
        status: item.status,
        favorite: item.favorite
      };
    },

    invokeSearchBar: function() {
      this.searching = true;
      this.$nextTick(() => this.$el.querySelector('#search').focus());
    },

    /** refresh list when I new item was added */
    newItemAdded: function(item) {
      Materialize.toast('Item added!', 4000);

      // just in case that the request to update is slow
      this.items.unshift(this.normalizeItems(item))
      this.formItemModal = false;

      // it's better to do that because the item object is the same for all items
      // the item from the add request is a little different than the retrieved one
      this.updateList();
    },

    /** It uses this function to handle arrow left|right that wasn't be handle by Vue correctly */
    handleKey: function(e) {
      let elem = this.$el.querySelector(':focus');

      switch(e.keyCode) {
        // ArrowDown
        case 40:
          this.arrowDown(elem);
          break;

        // ArrowUp
        case 38:
          this.arrowUp(elem);
          break;

        // ArrowLeft
        case 37:
          this.arrowLeft(elem);
          break;

        // ArrowRight
        case 39:
          this.arrowRight(elem);
          break;
      }
    },

    arrowDown: function(el) {
      let quantityElementsByLine = Math.trunc(window.innerWidth / el.clientWidth);
      let next = el.parentElement;

      for (let i = 0; i < quantityElementsByLine && next.nextElementSibling; i++) {
        next = next.nextElementSibling;
      }

      next.firstChild.focus();
    },

    arrowUp: function(el) {
      let quantityElementsByLine = Math.trunc(window.innerWidth / el.clientWidth);
      let prev = el.parentElement;

      for (let i = 0; i < quantityElementsByLine && prev.previousElementSibling; i++) {
        prev = prev.previousElementSibling;
      }

      prev.firstChild.focus();
    },

    arrowLeft: function(el) {
      let prev = el.parentElement.previousElementSibling;
      if (!prev)
        return;

      prev.firstChild.focus();
    },

    arrowRight: function(el) {
      let next = el.parentElement.nextElementSibling;
      if (!next)
        return;

      next.firstChild.focus();
    },
  },

  /** computed */
  computed: {
    /** @task: add support for string with space in tags */
    getParsedSearch: function() {
      let search = this.search;
      let domain = search.match(/url:(\S+)/i);
      let tags = search.match(/tags:(\S+)/i);

      search = domain ? search.replace(domain[0], '') : search;
      search = tags ? search.replace(tags[0], '') : search;

      /** getting just what I need */
      domain = domain ? domain[1] : '';
      tags = tags ? tags[1] : '';

      return {
        search: search.trim(),
        domain: domain,
        tag: tags
      };
    },

    /** initial implemention to get all tags */
    allTags: function() {
      return [].concat.apply([], this.items.map(i => i.tags));
    }
  },

  /** Watch */
  watch: {
    items: function() {
      if (!document.querySelector(':focus') && this.items.length > 0)
        // just focus when the items were already rendered
        Vue.nextTick(() => document.querySelector('#list_item').firstChild.firstChild.focus());
    }
  },

  /** Components */
  components: {
    // 'tag-form': formTag,
    'item': itemsView,
    'formItem': formItem,
    'modalFormItem': Modal
  },
});
