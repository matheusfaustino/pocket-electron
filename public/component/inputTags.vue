<template>
    <input type="text" class="validate" />
</template>
<style src="./../../node_modules/materialize-tags/dist/css/materialize-tags.css"/>


<script>
import Bloodhound from 'corejs-typeahead/dist/bloodhound.js'
import 'corejs-typeahead/dist/typeahead.jquery.js'
import 'materialize-tags'

export default {
    props: ['autocomplete', 'tags', 'refresh'],

    mounted: function() {
        this.createInput();
        this.addTags();
    },

    methods: {
        createInput: function() {
            $(this.$el).materialtags({
                confirmKeys: [188], // 13 = enter | 188 = comma
                typeaheadjs: [
                    { highlight: true },
                    { source: this.getEngine }
                ],

                freeInput: true,
            })

            // update v-on: var
            $(this.$el).on('itemAdded', this.update);
            $(this.$el).on('itemRemoved', this.update);

            $(this.$el).materialtags('focus');
        },

        destroyInput: function() {
            $(this.$el).materialtags('removeAll');
            $(this.$el).materialtags('destroy');
        },

        addTags: function() {
            let tags = this.tags;
            if (!tags || tags.lenght === 0) return;

            // let el = this.$el;
            tags.map(i => $(this.$el).materialtags('add', i));
        },

        update: function(e) {
            this.$emit('input', $(this.$el).materialtags('items'))
            $(this.$el).materialtags('focus');
        }
    },

    computed: {
        getEngine: function() {
            return new Bloodhound({
                local: this.autocomplete,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                datumTokenizer: Bloodhound.tokenizers.whitespace
            });
        }
    },

    watch: {
        refresh: function() {
            this.destroyInput();
            this.createInput();
            this.addTags();
        }
    }
}
</script>
