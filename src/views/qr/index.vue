<template>
  <div class="qr-container">
    <div class="qr-content">
      <!-- 标题 -->
      <h1 class="qr-title">支付宝转账</h1>
      
      <!-- 二维码区域 -->
      <!-- <div class="qr-code-wrapper">
        <canvas ref="qrCanvas" class="qr-canvas"></canvas>
      </div> -->
      
      <!-- 信息区域 -->
      <div class="info-section">
        <!-- 支付宝账号 -->
        <div class="info-row">
          <span class="info-label">支付宝账号</span>
          <span class="info-value">{{ orderData.bank_card || '--' }}</span>
          <span class="copy-btn" @click="copyToClipboard(orderData.bank_card)">复制</span>
        </div>
        
        <!-- 姓名 -->
        <div class="info-row">
          <span class="info-label">姓名</span>
          <span class="info-value">{{ orderData.bank_user || '--' }}</span>
          <span class="copy-btn" @click="copyToClipboard(orderData.bank_user)">复制</span>
        </div>
        
        <!-- 金额 -->
        <div class="info-row">
          <span class="info-label">金额</span>
          <span class="info-value">{{ formattedAmount || '--' }}</span>
          <span class="copy-btn" @click="copyToClipboard(formattedAmount)">复制</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getOrderInfoForQR } from '@/http/apis/merchant';
import { copy } from '@/utils/common';
import QRCode from 'qrcode';
import { ElMessage } from 'element-plus';

export default {
  name: 'QRCodePage',
  setup() {
    const route = useRoute();
    const qrCanvas = ref(null);
    const orderData = ref({
      bank_user: '',
      bank_card: '',
      apply_amount: 0
    });
    const loading = ref(false);

    // 格式化金额
    const formattedAmount = computed(() => {
      const amount = orderData.value.apply_amount;
      if (!amount && amount !== 0) return '--';
      return '¥' + parseFloat(amount).toFixed(2);
    });

    // 复制到剪贴板
    const copyToClipboard = (text) => {
      if (!text || text === '--') {
        ElMessage.warning('没有可复制的内容');
        return;
      }
      try {
        copy(text);
        ElMessage.success('复制成功');
      } catch (error) {
        ElMessage.error('复制失败');
      }
    };

    // 生成二维码
    const generateQRCode = async (orderId) => {
      if (!qrCanvas.value) return;
      
      const qrUrl = `http://129.226.114.211:8081/qr/${orderId}`;
      
      try {
        await QRCode.toCanvas(qrCanvas.value, qrUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (error) {
        console.error('生成二维码失败:', error);
        ElMessage.error('生成二维码失败');
      }
    };

    // 加载订单数据
    const loadOrderData = async () => {
      const orderId = route.params.orderId;
      if (!orderId) {
        ElMessage.error('订单号不能为空');
        return;
      }

      loading.value = true;
      try {
        const response = await getOrderInfoForQR(orderId);
        if (response.status && response.data) {
          orderData.value = response.data;
          // 生成二维码
          await generateQRCode(orderId);
        } else {
          ElMessage.error(response.data || '获取订单信息失败');
        }
      } catch (error) {
        console.error('加载订单数据失败:', error);
        ElMessage.error('加载订单数据失败');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      // 修改页面标题
      document.title = '支付页面';
      loadOrderData();
    });

    onUnmounted(() => {
      // 页面卸载时恢复默认标题（可选，根据需求决定是否保留）
      // document.title = '商户后台';
    });

    return {
      qrCanvas,
      orderData,
      loading,
      formattedAmount,
      copyToClipboard
    };
  }
};
</script>

<style scoped lang="less">
.qr-container {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

.qr-content {
  max-width: 600px;
  width: 100%;
}

.qr-title {
  font-size: 28px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 40px;
  text-align: center;
}

.qr-code-wrapper {
  margin: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.qr-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background-color: #ffffff;
}

.info-section {
  margin-top: 40px;
  text-align: left;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 18px;
  line-height: 1.8;
  color: #333333;
}

.info-label {
  min-width: 120px;
  color: #666666;
  font-weight: normal;
  text-align: left;
  font-size: 18px;
}

.info-value {
  flex: 1;
  color: #333333;
  margin-left: 20px;
  margin-right: 10px;
  word-break: break-all;
  text-align: left;
  font-size: 18px;
}

.copy-btn {
  color: #409eff;
  cursor: pointer;
  user-select: none;
  font-size: 16px;
  padding: 6px 16px;
  border: 1px solid #409eff;
  border-radius: 4px;
  background-color: #ffffff;
  transition: all 0.3s;
  display: inline-block;
  min-width: 60px;
  text-align: center;
  
  &:hover {
    color: #ffffff;
    background-color: #409eff;
    border-color: #409eff;
  }
  
  &:active {
    color: #ffffff;
    background-color: #3a8ee6;
    border-color: #3a8ee6;
  }
}
</style>

