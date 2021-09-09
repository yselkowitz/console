import { testName } from '../../support';
import { VirtualMachineData } from '../../types/vm';
import {
  DEFAULTS_VALUES,
  TEMPLATE,
  VM_ACTION,
  VM_ACTION_TIMEOUT,
  VM_STATUS,
  YAML_VM_NAME,
} from '../../utils/const/index';
import { ProvisionSource } from '../../utils/const/provisionSource';
import { detailViewAction } from '../../views/actions';
import { dashboardTab, detailsTab } from '../../views/selector';
import { tab } from '../../views/tab';
import { virtualization } from '../../views/virtualization';
import { vm } from '../../views/vm';

const vmData: VirtualMachineData = {
  name: `test-vm-details-${testName}`,
  description: 'rhel8 vm for details',
  namespace: testName,
  template: TEMPLATE.RHEL8,
  provisionSource: ProvisionSource.REGISTRY,
  pvcSize: '1',
  sshEnable: true,
  startOnCreation: true,
};

describe('Test VM details tab', () => {
  before(() => {
    cy.Login();
    cy.createProject(testName);
    virtualization.vms.visit();
    vm.create(vmData);
  });

  after(() => {
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: vmData.name,
        namespace: vmData.namespace,
      },
    });
    cy.deleteResource({
      kind: 'VirtualMachine',
      metadata: {
        name: YAML_VM_NAME,
        namespace: testName,
      },
    });
  });

  it('ID(CNV-4037) Check VM details while VM is running without guest agent installed', () => {
    cy.byLegacyTestID(vmData.name)
      .should('exist')
      .click();
    tab.navigateToDetails();

    cy.get(detailsTab.vmHostname).should('contain', DEFAULTS_VALUES.GUEST_AGENT_REQUIRED);
    cy.get(detailsTab.vmTimezone).should('contain', DEFAULTS_VALUES.GUEST_AGENT_REQUIRED);
    cy.get(detailsTab.activeUser).should('contain', DEFAULTS_VALUES.GUEST_AGENT_REQUIRED);
    cy.get(detailsTab.services).should('contain', `${vmData.name}-ssh-service`);
  });

  it('ID(CNV-763) Check VM details while VM is off', () => {
    vm.createFromYAML();
    // Details card
    tab.navigateToDetails();
    cy.get(detailsTab.vmName).should('contain', YAML_VM_NAME);
    cy.get(detailsTab.vmNS).should('contain', testName);
    cy.get(detailsTab.vmOS).should('contain', TEMPLATE.RHEL8.os);
    cy.get(detailsTab.vmTemplate).should('contain', 'rhel8-server-tiny');
    cy.get(detailsTab.vmStatus).should('contain', VM_STATUS.Stopped);
    cy.get(detailsTab.vmPod).should('contain', DEFAULTS_VALUES.NOT_AVAILABLE);
    cy.get(detailsTab.vmIP).should('contain', DEFAULTS_VALUES.NOT_AVAILABLE);
    cy.get(detailsTab.vmHostname).should('contain', DEFAULTS_VALUES.VM_NOT_RUNNING);
    cy.get(detailsTab.vmTimezone).should('contain', DEFAULTS_VALUES.VM_NOT_RUNNING);
    cy.get(detailsTab.vmNode).should('contain', DEFAULTS_VALUES.NOT_AVAILABLE);
    cy.get(detailsTab.activeUser).should('contain', DEFAULTS_VALUES.VM_NOT_RUNNING);
  });

  it('ID(CNV-4037) Check VM details while VM is running', () => {
    // make it downstream only as VM created from yaml have guest agent enabled.
    if (Cypress.env('DOWNSTREAM')) {
      // wait for guest agent ready before move to details tab
      tab.navigateToOverview();
      detailViewAction(VM_ACTION.Start);

      // Status card
      cy.contains(dashboardTab.vmHealth, VM_STATUS.Starting, {
        timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
      }).should('exist');
      cy.contains(dashboardTab.vmHealth, VM_STATUS.Running, {
        timeout: VM_ACTION_TIMEOUT.VM_IMPORT_AND_BOOTUP,
      }).should('exist');
      cy.get(dashboardTab.guestAgentOK, { timeout: 180000 }).should('exist');

      tab.navigateToDetails();
      cy.get(detailsTab.vmName).should('contain', YAML_VM_NAME);
      cy.get(detailsTab.vmNS).should('contain', testName);
      cy.get(detailsTab.vmOS).should('contain', 'Red Hat Enterprise Linux');
      cy.get(detailsTab.vmTemplate).should('contain', 'rhel8-server-tiny');
      cy.get(detailsTab.vmStatus).should('contain', VM_STATUS.Running);
      cy.get(detailsTab.vmPod).should('not.contain', DEFAULTS_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmIP).should('not.contain', DEFAULTS_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.vmHostname).should('contain', YAML_VM_NAME);
      cy.get(detailsTab.vmTimezone).should('contain', 'EDT');
      cy.get(detailsTab.vmNode).should('not.contain', DEFAULTS_VALUES.NOT_AVAILABLE);
      cy.get(detailsTab.activeUser).should('contain', 'No Active Users');
    }
  });
});