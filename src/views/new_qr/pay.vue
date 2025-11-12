<template>
  <div class="pay-page">
    <div class="container">
      <div class="header">
        <div class="logo-wrap">
          <img :src="logoImg" alt="支付宝Logo">
          <span>支付宝转账</span>
        </div>
      </div>

      <div class="step">
        <div class="step-title">第一步：确认付款信息</div>
        <div v-if="loading" class="loading">加载中...</div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="!loading && !error && orderData" class="order-info">
          <div class="info-item">
            <span class="label">支付宝账号</span>
            <span class="value">{{ orderData.bank_card || '--' }}</span>
            <button class="copy-btn" @click="copyBankCard">复制</button>
          </div>
          <div class="info-item">
            <span class="label">金额</span>
            <span class="value">{{ formattedAmount }}</span>
            <button class="copy-btn" @click="copyAmount">复制</button>
          </div>
          <div class="info-item">
            <span class="label">姓名</span>
            <span class="value">{{ maskedName }}</span>
            <button class="copy-btn" @click="copyNameFirstChar">复制</button>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-title">第二步：复制并前往支付宝</div>
        <div class="tip">
          1. 复制上方的支付宝账号和金额<br>
          2. 打开支付宝 → 点击"转账" → "转到支付宝账户"<br>
          3. 粘贴刚才复制的信息，核对收款人姓名后进行转账
        </div>
      </div>
    </div>

    <div v-if="showOverlay" class="overlay" @click="showOverlay = false">
      <div class="overlay-box" @click.stop>
        <h3>请在外部默认浏览器打开</h3>
        <p>当前页面在支付宝内无法直接跳转。</p>
        <p>请点击右上角 <span class="hint">⋯</span> → 选择 <span class="hint">在默认浏览器中打开</span></p>

        <!-- 内置SVG引导图，无需外部图片 -->
        <svg class="guide-svg" viewBox="0 0 820 460" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#eaf4ff"/>
              <stop offset="1" stop-color="#ffffff"/>
            </linearGradient>
          </defs>
          <rect x="20" y="60" rx="16" ry="16" width="780" height="360" fill="url(#g1)" stroke="#dbe7f5"/>
          <rect x="20" y="60" rx="16" ry="16" width="780" height="68" fill="#108ee9"/>
          <circle cx="760" cy="94" r="6" fill="#fff"/>
          <circle cx="740" cy="94" r="6" fill="#fff"/>
          <circle cx="720" cy="94" r="6" fill="#fff"/>
          <rect x="540" y="110" width="240" height="150" rx="10" ry="10" fill="#fff" stroke="#dfe8f3"/>
          <rect x="550" y="130" width="220" height="40" rx="8" ry="8" fill="#e8f3ff" stroke="#bcdcff"/>
          <text x="560" y="156" font-size="18" font-weight="600" fill="#0b72c7">在默认浏览器中打开</text>
          <path d="M690,110 C690,110 640,130 610,190" fill="none" stroke="#2b8df5" stroke-width="10"/>
          <polygon points="610,190 640,186 628,210" fill="#2b8df5"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getOrderInfoForQR } from '@/http/apis/merchant';
import { ElMessage } from 'element-plus';
import logoImg from './img/logo2.png';

export default {
  name: 'PayPage',
  setup() {
    const route = useRoute();
    const loading = ref(false);
    const error = ref('');
    const showOverlay = ref(false);
    const orderData = ref(null);

    // 格式化金额
    const formattedAmount = computed(() => {
      if (!orderData.value || !orderData.value.apply_amount) return '--';
      return parseFloat(orderData.value.apply_amount).toFixed(2);
    });

    // 脱敏姓名
    const maskedName = computed(() => {
      if (!orderData.value || !orderData.value.bank_user) return '--';
      const rawName = orderData.value.bank_user;
      if (rawName.length > 2) {
        return rawName.replace(/(?<=.).(?=.)/g, '*');
      }
      return rawName;
    });

    // 获取订单ID
    const getOrderId = () => {
      // 优先从路由参数获取
      if (route.params.orderId) {
        return route.params.orderId;
      }
      // 从查询参数获取
      if (route.query.orderId) {
        return route.query.orderId;
      }
      return null;
    };

    // 加载订单数据
    const loadOrderData = async () => {
      const orderId = getOrderId();
      if (!orderId) {
        error.value = '订单号不能为空';
        return;
      }

      loading.value = true;
      error.value = '';
      
      try {
        const response = await getOrderInfoForQR(orderId);
        if (response.status && response.data) {
          orderData.value = response.data;
        } else {
          error.value = response.data || '获取订单信息失败';
        }
      } catch (err) {
        console.error('加载订单数据失败:', err);
        error.value = '加载订单数据失败，请稍后重试';
      } finally {
        loading.value = false;
      }
    };

    // 复制文本（与 pay.html 保持一致）
    const copyText = async (text) => {
      if (!text || text === '--') {
        ElMessage.warning('没有可复制的内容');
        return;
      }
      try {
        // 优先使用现代 Clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          ElMessage.success('已复制：' + text);
        } else {
          // 降级方案：使用 document.execCommand
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
            ElMessage.success('已复制：' + text);
          } catch (e) {
            ElMessage.error('复制失败');
          }
          document.body.removeChild(ta);
        }
      } catch (err) {
        // 如果 Clipboard API 失败，尝试降级方案
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          ElMessage.success('已复制：' + text);
        } catch (e) {
          ElMessage.error('复制失败');
        }
      }
    };

    // 复制支付宝账号
    const copyBankCard = () => {
      if (!orderData.value || !orderData.value.bank_card) {
        ElMessage.warning('没有可复制的内容');
        return;
      }
      copyText(orderData.value.bank_card);
    };

    // 复制金额（去掉￥符号）
    const copyAmount = () => {
      if (!orderData.value || !orderData.value.apply_amount) {
        ElMessage.warning('没有可复制的内容');
        return;
      }
      const amount = parseFloat(orderData.value.apply_amount).toFixed(2);
      copyText(amount);
    };

    // 复制姓名首字符
    const copyNameFirstChar = () => {
      if (!orderData.value || !orderData.value.bank_user) {
        ElMessage.warning('没有可复制的内容');
        return;
      }
      const firstChar = orderData.value.bank_user.charAt(0);
      copyText(firstChar);
    };

    // 检查是否在支付宝内打开
    const checkAlipayClient = () => {
      if (/AlipayClient/i.test(navigator.userAgent)) {
        showOverlay.value = true;
      }
    };

    onMounted(() => {
      // 修改页面标题
      document.title = '支付宝转账';
      // 加载订单数据
      loadOrderData();
      // 检查是否在支付宝内打开
      checkAlipayClient();
    });

    return {
      logoImg,
      loading,
      error,
      showOverlay,
      orderData,
      formattedAmount,
      maskedName,
      copyBankCard,
      copyAmount,
      copyNameFirstChar
    };
  }
};
</script>

<style scoped lang="less">
.pay-page {
  font-family: "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  background-color: #f5f6f7;
  min-height: 100vh;
  padding: 0;
  margin: 0;
  color: #333;
}

.container {
  max-width: 480px;
  margin: 0 auto;
  background: #fff;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.05);
  overflow: hidden;
}

.header {
  background-color: #108ee9;
  color: #fff;
  padding: 10px 0;
  text-align: center;
  
  .logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  img {
    width: 44px;
    height: 44px;
    vertical-align: middle;
  }
  
  span {
    font-size: 21px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
}

.step {
  border-bottom: 1px solid #eee;
  padding: 22px 20px;
  
  &:last-child {
    border-bottom: none;
  }
}

.step-title {
  font-weight: 600;
  color: #108ee9;
  margin-bottom: 10px;
  font-size: 17px;
}


.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed #eee;
  gap: 10px;
  
  &:last-child {
    border-bottom: none;
  }
}

.label {
  color: #666;
  font-size: 15px;
  white-space: nowrap;
}

.value {
  font-weight: 600;
  font-size: 16px;
  word-break: break-all;
  flex: 1;
  text-align: right;
}

.copy-btn {
  background: #108ee9;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  
  &:hover {
    background: #0c7cd5;
  }
  
  &:active {
    background: #0a6bb8;
  }
}

.tip {
  font-size: 14px;
  line-height: 1.7;
  color: #555;
  margin-top: 10px;
}

.alipay-btn {
  display: block;
  width: 100%;
  background: #108ee9;
  color: #fff;
  text-align: center;
  padding: 14px 0;
  font-size: 17px;
  font-weight: 600;
  border-radius: 10px;
  margin-top: 18px;
  text-decoration: none;
  transition: background 0.2s;
  
  &:hover {
    background: #0c7cd5;
  }
}

.loading {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.error {
  text-align: center;
  padding: 40px 20px;
  color: #ff4d4f;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.overlay-box {
  background: #fff;
  color: #333;
  padding: 24px 20px;
  border-radius: 12px;
  width: 92%;
  max-width: 460px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  text-align: center;
  
  h3 {
    color: #108ee9;
    margin: 0 0 8px;
  }
  
  p {
    margin: 6px 0;
    color: #444;
    font-size: 14px;
    line-height: 1.6;
  }
}

.hint {
  display: inline-block;
  background: #f2f8ff;
  color: #0b72c7;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.guide-svg {
  width: 100%;
  height: auto;
  margin-top: 12px;
  border-radius: 10px;
  display: block;
}
</style>

