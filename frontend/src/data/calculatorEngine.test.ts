import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRoi,
  DEFAULT_CLIENT_INPUTS_MXN,
  DEFAULT_CLIENT_INPUTS_USD,
  DEFAULT_DEVELOPER_CONFIG,
  buildProposalMarkdown,
  buildWhatsAppMessage
} from './calculatorEngine.ts';

test('calculateRoi: Floor Cost boundary test in MXN', () => {
  const zeroBleed = {
    lostHoursPerWeek: 0,
    hourlyLaborCost: 0,
    averageTicketValue: 0,
    monthlyLeadsOrClients: 0,
    lostClientsPercentage: 0,
    humanErrorsMonthlyCost: 0
  };

  const selectedIds = ['ai-sales-bot']; // 24 hrs + 6 + 4 = 34 hrs * ($13 USD * 18.5 = $240.5) = $8,177 MXN
  const result = calculateRoi(selectedIds, zeroBleed, DEFAULT_DEVELOPER_CONFIG, 'MXN');

  assert.equal(result.totalAutomationHours, 24);
  assert.equal(result.platformAndPmHours, 10);
  assert.equal(result.totalProjectHours, 34);
  assert.equal(result.technicalFloorCost, 8177);
  assert.equal(result.recommendedSetupPrice, 8177, 'Setup price must never fall below technical floor');
});

test('calculateRoi: Native MXN business value calculation', () => {
  const mxnBleed = {
    lostHoursPerWeek: 15,
    hourlyLaborCost: 200, // $200 MXN/hr
    averageTicketValue: 3500, // $3500 MXN ticket
    monthlyLeadsOrClients: 30,
    lostClientsPercentage: 20,
    humanErrorsMonthlyCost: 3000
  };

  const selectedIds = ['ai-sales-bot', 'calendar-sync'];
  const result = calculateRoi(selectedIds, mxnBleed, DEFAULT_DEVELOPER_CONFIG, 'MXN');

  assert.ok(result.recommendedSetupPrice >= result.technicalFloorCost);
  assert.ok(result.yearOneNetSavings > 0);
  assert.ok(result.roiPercentage > 50);
  assert.equal(result.currency, 'MXN');
});

test('buildProposalMarkdown: Confidential mode strips sensitive financial data', () => {
  const selectedIds = ['ai-sales-bot'];
  const result = calculateRoi(selectedIds, DEFAULT_CLIENT_INPUTS_MXN, DEFAULT_DEVELOPER_CONFIG, 'MXN');

  const confidentialProposal = buildProposalMarkdown(selectedIds, DEFAULT_CLIENT_INPUTS_MXN, result, 'MXN', true);
  const fullProposal = buildProposalMarkdown(selectedIds, DEFAULT_CLIENT_INPUTS_MXN, result, 'MXN', false);

  assert.ok(confidentialProposal.includes('Modo Confidencial'));
  assert.ok(!confidentialProposal.includes('Horas invertidas'));
  assert.ok(!confidentialProposal.includes('Ticket promedio'));
  assert.ok(!confidentialProposal.includes('Fuga anual'));

  assert.ok(fullProposal.includes('Fuga anual acumulada'));
  assert.ok(fullProposal.includes('Ticket promedio'));
});

test('buildWhatsAppMessage: Confidential mode privacy check', () => {
  const selectedIds = ['ai-sales-bot'];
  const result = calculateRoi(selectedIds, DEFAULT_CLIENT_INPUTS_MXN, DEFAULT_DEVELOPER_CONFIG, 'MXN');

  const confidentialMsg = buildWhatsAppMessage(selectedIds, result, 'MXN', true);
  const fullMsg = buildWhatsAppMessage(selectedIds, result, 'MXN', false);

  assert.ok(confidentialMsg.includes('Modo Confidencial'));
  assert.ok(!confidentialMsg.includes('Fuga anual'));

  assert.ok(fullMsg.includes('Fuga anual detectada'));
});
