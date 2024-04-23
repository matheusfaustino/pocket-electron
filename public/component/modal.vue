<template>
    <div v-bind:class="[footer ? 'modal-fixed-footer' : '', userClass, defaultClass]">
        <div class="modal-content">
            <slot name="content"></slot>
        </div>
        <div v-if="footer" class="modal-footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script>
import 'materialize-css'

export default {
    props: {
        config: Object,
        userClass: String,
        openModal: {
            type: Boolean,
            default: false,
            required: true
        },
        footer: {
            type: Boolean,
            default: false
        },
    },
    data: function() {
        return {
            defaultClass: 'modal'
        };
    },

    mounted: function() {
        var _this = this;

        let defaultOptions = {
            dismissible: true, // Modal can be dismissed by clicking outside of the modal
            opacity: .5, // Opacity of modal background
            inDuration: 300, // Transition in duration
            outDuration: 200, // Transition out duration
            startingTop: '4%', // Starting top style attribute
            endingTop: '10%', // Ending top style attribute
            ready: function(modal, trigger) {
                // Callback for Modal open. Modal and trigger parameters available.
                _this.$emit('open', {modal: modal, trigger: trigger});
            },
            complete: function() {
                // Callback for Modal close
                _this.$emit('close');
            }
        }

        let options = Object.assign({}, defaultOptions, this.config);

        $(this.$el).modal(options);
    },

    watch: {
        openModal: function() {
            $(this.$el).modal(this.openModal ? 'open' : 'close');
        }
    }

}
</script>
