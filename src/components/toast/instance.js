import { defineComponent, reactive, watch, onMounted, toRefs } from 'vue';
export default defineComponent({
  name: 'toast',
  props: {
    message: {
      type: String,
      default: '请求超时'
    },
    onClose: {
      type: Function
    },
    duration: {
      type: Number,
      default: 5000
    },
    zIndex: {
      type: Number,
      default: 3000
    }
  },
  setup(props) {
    const state = reactive({
      show: true,
      timer: null,
      closed: false
    });
    const close = () => {
      state.closed = true;
      // 执行关闭回调
      if (typeof props.onClose === 'function') {
        props.onClose(this);
      }
    };
    const startTimer = () => {
      if (props.duration > 0) {
        state.timer = setTimeout(() => {
          if (!state.closed) {
            // 关闭 toast
            close();
          }
        }, props.duration);
      }
    };
    const handleAfterLeave = currentElement => {
      if (currentElement && currentElement.parentNode) {
        currentElement.parentNode.removeChild(currentElement);
      }
    };
    onMounted(() => {
      startTimer();
    });
    watch(
      () => state.closed,
      newVal => {
        if (newVal) {
          state.show = false;
        }
      }
    );
    return {
      ...toRefs(state),
      close,
      handleAfterLeave
    };
  }
});
