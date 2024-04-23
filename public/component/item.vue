<template>
    <div class="card small hoverable item" tabindex="0"
      v-on:click.meta.stop.prevent="openExternal"
      v-on:focus="focus"
      v-on:blur="blur"
      @keyup.t="showTagModal != true && $el.querySelector('.tag').click()"
      @keyup.d="showTagModal != true && $el.querySelector('.remove-item').click()"
      >
        <div class="card-image" v-if="item.image">
            <img :src="item.image">
        </div>

        <div class="card-content">
            <span class="card-title activator grey-text text-darken-4">
                {{ item.title }}
                <i class="material-icons right">more_vert</i>
            </span>
            <p v-if="!item.image">{{ item.desc }}</p>
        </div>

        <div class="card-action">
          <a v-on:click="showTagModal = true" class="teal-text text-lighten-1 tag">
            <i class="material-icons">local_offer</i>
          </a>

          <a v-on:click="removeItem" class="teal-text text-lighten-1 remove-item">
            <i class="material-icons">delete</i>
          </a>

        </div>

        <div class="card-reveal">
            <span class="card-title grey-text text-darken-4">
                {{ item.title }}
                <i class="material-icons right">close</i>
            </span>
            <p>{{ item.desc }}</p>
            <ul v-if="item.tags">
                <li v-for="tag in item.tags">{{ tag }}</li>
            </ul>
        </div>

        <modal v-on:open="openModal" v-on:close="closeModal" :openModal="showTagModal">
          <div class="row" slot="content">
            <h4>Add Tag: {{ item.title }}</h4>
            <tag-form
              v-on:submit="savedTags"
              :item="item"
              :refresh="refreshTagForm"
              :autocomplete="$root.allTags"></tag-form>
          </div>
        </modal>
    </div>
</template>

<script>
import TagForm from './tagForm.vue';
import Modal from './modal.vue';

export default {
  props: ['item'],

  data: function() {
    return {
      showTagModal: false,
      refreshTagForm: false
    };
  },

  methods: {
    savedTags: function(newTags) {
      Materialize.toast('Tags saved!', 4000);
      this.showTagModal = false;

      // this bug drove me crazy, really! I dunno why, but when I do a $set with an array,
      // Vue copies the __ob__ of that array too (why? I dunno, really)
      // So, first thing first. As do you see, I pass the tags to the form and the form
      // pass the tags to a special input (jquery plugin, yeah I don't love me) and every time
      // that plugin changes its value, it emits a event (by v-model) to the form and then
      // the form submits and emits this event and then the change is "committed". But, but!, because of the
      // copy of __ob__ property, the parent's variable is affected after every modification in the child component,
      // even if it wasn't submitted, and man, it depressed me... I was really sad about this bug
      // @task: create a issue
      this.$root.$set(this.item, 'tags', newTags.slice(0));
    },

    openModal: function() {
      this.refreshTagForm = true;
    },

    closeModal: function() {
      this.refreshTagForm = false;
      this.showTagModal = false;

      // return the focus to the element
      this.$el.focus();
    },

    openExternal: function() {
        // @task: it's using electron directly
        require('electron').shell.openExternal(this.item.url);
    },

    removeItem: function() {
        var _this = this;

        // @task: it's using native confirm dialog
        if (confirm('Do you really want delete it?')){
            this.$root.client.removeItem(this.item.id)
            .then(() => {
                _this.$root.updateList();
                Materialize.toast('Item Removed!', 4000);
            });
        }
    },

    /** applies hoverable effect when use the keyboard */
    focus: function() {
      this.$el.style.boxShadow = '0 8px 17px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)';
    },
    blur: function() {
      this.$el.style.boxShadow = '';
    },

  },

  components: {
    'tag-form': TagForm,
    'modal': Modal
  }

}
</script>

