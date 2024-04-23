<template>
  <form class="col s12" v-on:submit.prevent="submit">
      <div class="row">
          <div class="col s12">
              <input-tag
                v-model="tags"
                :tags="item.tags"
                :refresh="refresh"
                :autocomplete="autocomplete"></input-tag>
          </div>
      </div>
      <button type="submit" class="waves-effect waves-light btn">Save</button>
   </form>
</template>

<script>
import InputTags from './inputTags.vue'

export default {
    props: {
      autocomplete: Array,
      item: {
        type: Object,
        required: true
      },
      refresh: {
        type: Boolean,
        default: false
      }
    },

    data: function() {
      return {
        tags: Array,
      };
    },

    methods: {
      submit: function() {
        var _this = this;

        this.$root.client
        .modifyItem('tags_replace', this.item.id, {tags: this.tags.toString()})
        .then(function(resp) {
          if (resp.status === 200 && resp.data.status === 1) {
            // return new tags
            _this.$emit('submit', _this.tags);
          }
        })
        .catch(this.$root.client.fullError);
      }
    },

    components: {
        'input-tag': InputTags
    }
}
</script>
