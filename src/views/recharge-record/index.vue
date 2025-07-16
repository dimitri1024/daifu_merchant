<template>
  <div>
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>发起单笔提现</span>
        </div>
      </template>
      <div style="padding: 20px; width: 600px; margin: 0 auto">
        <el-form ref="formInlineRef" :model="formInline" class="demo-form-inline" label-width="auto" :rules="rules">
          <el-form-item label="账户金额">
            <el-input size="small" :model-value="toFixedNReport(formInline.balance)" placeholder="" autocomplete="off" disabled></el-input>
          </el-form-item>
          <el-form-item label="提现金额" prop="amount">
            <el-input size="small" v-model.trim="formInline.amount" type="number" autocomplete="off" placeholder="请输入提现金额"></el-input>
          </el-form-item>
          <el-form-item label="通道编码" prop="pay_type">
            <el-select v-model="formInline.pay_type" filterable clearable placeholder="请选择通道编码" @click="getPayTypeHandle">
              <el-option v-for="(cItem, index) in payTypeList" :key="index" :label="cItem.name" :value="cItem.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="收款银行" prop="bank_name" v-if="(formInline.pay_type == null || formInline.pay_type == 'bank' || formInline.pay_type == 'ZTO_PUBLIC')">
            <el-select v-model="formInline.bank_name" filterable clearable placeholder="请选择收款银行" @click="getBankList">
              <el-option v-for="(cItem, index) in bankList" :key="index" :label="cItem" :value="cItem"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="收款姓名" prop="bank_user">
            <el-input size="small" v-model.trim="formInline.bank_user" autocomplete="off" placeholder="请输入收款姓名"></el-input>
          </el-form-item>
          <el-form-item label="收款卡号" prop="bank_card">
            <el-input size="small" v-model.trim="formInline.bank_card" autocomplete="off" type="text" placeholder="请输入收款卡号"></el-input>
          </el-form-item>
          <el-form-item label="开户行" v-if="(formInline.pay_type == null || formInline.pay_type == 'bank' || formInline.pay_type == 'ZTO_PUBLIC')">
            <el-input size="small" v-model.trim="formInline.bank_open" autocomplete="off" placeholder="请输入开户行"></el-input>
          </el-form-item>
          <el-form-item label="省份" prop="prov_id">
            <el-input size="small" v-model.trim="formInline.prov_id" autocomplete="off" type="text" placeholder="请输入省份"></el-input>
          </el-form-item>
          <el-form-item label="地区" prop="area_id">
            <el-input size="small" v-model.trim="formInline.area_id" autocomplete="off" type="text" placeholder="请输入地区"></el-input>
          </el-form-item>
          <el-form-item label="证件号" prop="cert_no">
            <el-input size="small" v-model.trim="formInline.cert_no" autocomplete="off" type="text" placeholder="请输入证件号"></el-input>
          </el-form-item>
          <el-form-item label="动态密码" prop="code">
            <el-input size="small" v-model.trim="formInline.code" autocomplete="off" type="number" placeholder="请输入动态密码"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="insert">提交</el-button>
            <el-button size="small" @click="reset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>
<script>
import { defineComponent, reactive, ref, toRefs } from 'vue';
import { getBalance, getBankName, singleWithdrawal, getPayTypeList } from '../../http/apis/withdrawal';
import { toFixedNReport } from '../../utils/common';
import { ElMessage } from 'element-plus';

export default defineComponent({
  setup() {
    const formInlineRef = ref();
    const state = reactive({
      formInline: {}
    });
    const bankList = ref([]);
    const payTypeList = ref([]);

    // 获取用户余额信息
    const getBalanceHanlder = () => {
      getBalance().then(res => {
        state.formInline.balance = res.data || 0;
      });
    };

    // 获取银行名称列表
    const getBankList = () => {
      bankList.value = [];      
      getBankName().then(res => {
        if (res.status) {
          Object.keys(res.data).forEach(key => {
            bankList.value.push(key);
          });
        } else {
          ElMessage.error('获取银行列表信息失败，请刷新页面');
        }
      });
    };

    const getPayTypeHandle = () => {
      payTypeList.value = [];
      getPayTypeList().then(res => {
        if (res.status) {
          payTypeList.value = res.data;
        } else { 
          ElMessage.error('请刷新页面重新获取通道编码');
        }
      });
    };

    getBalanceHanlder();

    // 提交提现申请
    const insert = () => {
      formInlineRef.value.validate(valid => {
        if (valid) {
          if (parseFloat(state.formInline.amount) > parseFloat(state.formInline.balance)) {
            ElMessage.error('提现金额不能大于账户金额');
            return;
          }
          if (parseFloat(state.formInline.amount) < 1) {
            ElMessage.error('提现金额不能小于1');
            return;
          }
          if (parseFloat(state.formInline.amount) > 50000) {
            ElMessage.error('提现金额不能大于50000');
            return;
          }
          const params = {
            ...state.formInline
          };
          delete params.balance;
          singleWithdrawal(params).then(res => {
            if (res.status) {
              ElMessage.success('操作成功');
              reset();
              state.formInline.bank_open = '';
              getBalanceHanlder();
            }
          });
        } else {
          return false;
        }
      });
    };

    // 重置表单
    const reset = () => {
      formInlineRef.value.resetFields();
      state.formInline.bank_open = '';
    };

    const rules = {
      amount: [
        {
          required: true,
          message: '请输入提现金额，金额为1-50000之间',
          trigger: 'blur'
        }
      ],
      bank_name: [
        {
          required: true,
          message: '请选择收款银行',
          trigger: 'blur'
        }
      ],
      pay_type: [
        {
          required: true,
          message: '请选择通道编码',
          trigger: 'blur'
        }
      ],
      bank_user: [
        {
          required: true,
          message: '请输入收款姓名',
          trigger: 'blur'
        }
      ],
      bank_card: [
        {
          required: true,
          message: '请输入收款卡号',
          trigger: 'blur'
        }
      ],
      bank_open: [
        {
          required: true,
          message: '请输入开户行',
          trigger: 'blur'
        }
      ],
      area_id: [
        {
          required: false,
          message: '请输入地区',
          trigger: 'blur'
        }
      ],
      prvo_id: [
        {
          required: false,
          message: '请输入省份',
          trigger: 'blur'
        }
      ],
      cert_no: [
        {
          required: false,
          message: '请输入证件号',
          trigger: 'blur'
        }
      ],
      code: [
        {
          required: true,
          message: '请输入动态密码',
          trigger: 'blur'
        }
      ]
    };

    return {
      ...toRefs(state),
      formInlineRef,
      insert,
      rules,
      reset,
      bankList,
      payTypeList,
      getBankList,
      toFixedNReport,
      getPayTypeHandle
    };
  }
});
</script>

<style scoped lang="less">
</style>