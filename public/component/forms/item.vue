<template>
<form v-on:submit.prevent="submit">
    <div class="row">
        <div class="input-field col s12">
            <input v-model="title" id="title" type="text" name="title" class="validate">
            <label for="title">Title</label>
        </div>
        <div class="input-field col s12">
            <input v-model="url" id="url" type="url" name="url" class="validate">
            <label for="url">Url</label>
        </div>
        <div class="input-field col s12">
            <input-tag
                v-model="tags"
                :refresh="refresh"
                :autocomplete="autocomplete"></input-tag>
            <label for="tags">Tags</label>
        </div>
    </div>

    <button type="submit" class="right waves-effect waves-light btn">Save</button>
</form>
</template>

<script>
import InputTags from './../inputTags.vue'
import electron from 'electron'

export default {
    props: {
      autocomplete: Array,
      refresh: {
        type: Boolean,
        default: false
      }
    },

    data: function() {
        return {
            tags: Array,
            title: '',
            url: ''
        };
    },

    methods: {
        submit: function() {
            var _this = this;

            this.$root.client
            .saveItem({
                url: this.url,
                title: this.title,
                tags: this.tags.toString()
            })
            .then(function(resp) {
                if (resp.status === 200 && resp.data.status === 1) {
                    // return new tags
                    _this.$emit('submit', resp.data.item);
                }
            })
            .catch(this.$root.client.fullError);
        }
    },

    components: {
        'inputTag': InputTags
    },

    watch: {
        refresh: function() {
            if (!this.refresh)
                return;

            this.url = '';
            this.title = '';
            this.tags = [];

            let clipboard = electron.clipboard;
            let paste = clipboard.readText();
            let pattern = /^(https?|ftp):\/\/[^\s\/$.?#].[^\s]*$/;
            // checks url
            if (pattern.test(paste)) {
            // paste item url
                this.url = paste;
            }

            this.$root.$nextTick(() => this.$el.querySelector('#url').focus())
        }
    }
}
</script>
