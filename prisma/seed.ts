import { PrismaClient } from '../src/generated/prisma';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create permissions
  const resources = [
    'processes', 'folders', 'users', 'roles', 'governance',
    'publications', 'dictionary', 'audit-logs', 'settings',
  ];
  const actions = ['create', 'read', 'update', 'delete', 'publish', 'approve', 'manage'];

  const permissions: { id: string; resource: string; action: string; description: string }[] = [];
  for (const resource of resources) {
    for (const action of actions) {
      permissions.push({
        id: crypto.randomUUID(),
        resource,
        action,
        description: `${action} ${resource}`,
      });
    }
  }

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { id: perm.id },
      update: {},
      create: perm,
    });
  }

  console.log(`Created ${permissions.length} permissions`);

  // Create system roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Administrator',
      description: 'Full system access with all permissions',
      isSystem: true,
    },
  });

  // Assign all permissions to admin role
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const processManagerRole = await prisma.role.upsert({
    where: { name: 'Process Manager' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Process Manager',
      description: 'Can create, edit, and publish processes',
      isSystem: true,
    },
  });

  const processManagerPerms = permissions.filter(
    (p) =>
      (p.resource === 'processes' && ['create', 'read', 'update', 'delete', 'publish'].includes(p.action)) ||
      (p.resource === 'folders' && ['create', 'read', 'update', 'delete'].includes(p.action)) ||
      (p.resource === 'publications' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'dictionary' && ['create', 'read', 'update'].includes(p.action)) ||
      (p.resource === 'governance' && ['read', 'approve'].includes(p.action))
  );

  for (const perm of processManagerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: processManagerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: processManagerRole.id, permissionId: perm.id },
    });
  }

  const analystRole = await prisma.role.upsert({
    where: { name: 'Process Analyst' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Process Analyst',
      description: 'Can view and comment on processes',
      isSystem: true,
    },
  });

  const analystPerms = permissions.filter(
    (p) =>
      (p.resource === 'processes' && ['read'].includes(p.action)) ||
      (p.resource === 'folders' && ['read'].includes(p.action)) ||
      (p.resource === 'publications' && ['read'].includes(p.action)) ||
      (p.resource === 'dictionary' && ['read'].includes(p.action)) ||
      (p.resource === 'governance' && ['read'].includes(p.action))
  );

  for (const perm of analystPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: analystRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: analystRole.id, permissionId: perm.id },
    });
  }

  const viewerRole = await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Viewer',
      description: 'Read-only access to published processes',
      isSystem: true,
    },
  });

  const viewerPerms = permissions.filter(
    (p) => p.action === 'read' && ['processes', 'publications', 'dictionary'].includes(p.resource)
  );

  for (const perm of viewerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: viewerRole.id, permissionId: perm.id },
    });
  }

  const governanceManagerRole = await prisma.role.upsert({
    where: { name: 'Governance Manager' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: 'Governance Manager',
      description: 'Manages governance workflows and approvals',
      isSystem: true,
    },
  });

  const govPerms = permissions.filter(
    (p) =>
      (p.resource === 'governance' && ['create', 'read', 'update', 'delete', 'approve', 'manage'].includes(p.action)) ||
      (p.resource === 'processes' && ['read'].includes(p.action))
  );

  for (const perm of govPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: governanceManagerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: governanceManagerRole.id, permissionId: perm.id },
    });
  }

  console.log('Created system roles: Administrator, Process Manager, Process Analyst, Viewer, Governance Manager');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@processflow.com' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'admin@processflow.com',
      passwordHash: hashSync('admin123', 12),
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT',
      jobTitle: 'System Administrator',
      isActive: true,
      isAdmin: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id, assignedBy: adminUser.id },
  });

  // Create demo users
  const demoUsers = [
    { email: 'john.doe@processflow.com', firstName: 'John', lastName: 'Doe', department: 'Operations', jobTitle: 'Process Manager', role: processManagerRole },
    { email: 'jane.smith@processflow.com', firstName: 'Jane', lastName: 'Smith', department: 'Quality', jobTitle: 'Process Analyst', role: analystRole },
    { email: 'bob.wilson@processflow.com', firstName: 'Bob', lastName: 'Wilson', department: 'Compliance', jobTitle: 'Governance Manager', role: governanceManagerRole },
    { email: 'alice.johnson@processflow.com', firstName: 'Alice', lastName: 'Johnson', department: 'HR', jobTitle: 'HR Specialist', role: viewerRole },
  ];

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        id: crypto.randomUUID(),
        email: userData.email,
        passwordHash: hashSync('password123', 12),
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        jobTitle: userData.jobTitle,
        isActive: true,
        isAdmin: false,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: userData.role.id } },
      update: {},
      create: { userId: user.id, roleId: userData.role.id, assignedBy: adminUser.id },
    });
  }

  console.log('Created demo users');

  // Create sample folders
  const rootFolder = await prisma.folder.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Organization Processes',
      description: 'Root folder for all organization processes',
      createdById: adminUser.id,
    },
  });

  const hrFolder = await prisma.folder.create({
    data: {
      id: crypto.randomUUID(),
      name: 'HR Processes',
      description: 'Human Resources processes',
      parentId: rootFolder.id,
      createdById: adminUser.id,
    },
  });

  const financeFolder = await prisma.folder.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Finance Processes',
      description: 'Financial processes and workflows',
      parentId: rootFolder.id,
      createdById: adminUser.id,
    },
  });

  const opsFolder = await prisma.folder.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Operations',
      description: 'Operational processes',
      parentId: rootFolder.id,
      createdById: adminUser.id,
    },
  });

  console.log('Created folder structure');

  // Create sample processes
  const sampleBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://processflow.com/bpmn">
  <bpmn2:process id="Process_1" name="Sample Process" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1" name="Start"/>
    <bpmn2:task id="Task_1" name="Review Request"/>
    <bpmn2:exclusiveGateway id="Gateway_1" name="Approved?"/>
    <bpmn2:task id="Task_2" name="Process Approval"/>
    <bpmn2:task id="Task_3" name="Send Rejection"/>
    <bpmn2:endEvent id="EndEvent_1" name="End"/>
    <bpmn2:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
    <bpmn2:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1"/>
    <bpmn2:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2" name="Yes"/>
    <bpmn2:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_3" name="No"/>
    <bpmn2:sequenceFlow id="Flow_5" sourceRef="Task_2" targetRef="EndEvent_1"/>
    <bpmn2:sequenceFlow id="Flow_6" sourceRef="Task_3" targetRef="EndEvent_1"/>
  </bpmn2:process>
</bpmn2:definitions>`;

  const johnUser = await prisma.user.findUnique({ where: { email: 'john.doe@processflow.com' } });

  const processes = [
    { name: 'Employee Onboarding', description: 'End-to-end employee onboarding process from offer acceptance to first day', category: 'HR', folderId: hrFolder.id, status: 'PUBLISHED', tags: 'onboarding,hr,employee' },
    { name: 'Purchase Order Approval', description: 'Standard purchase order review and approval workflow', category: 'Finance', folderId: financeFolder.id, status: 'PUBLISHED', tags: 'purchase,approval,finance' },
    { name: 'Incident Management', description: 'IT incident detection, classification, resolution and closure', category: 'IT', folderId: opsFolder.id, status: 'DRAFT', tags: 'incident,it,operations' },
    { name: 'Leave Request Process', description: 'Employee leave request submission and approval', category: 'HR', folderId: hrFolder.id, status: 'PUBLISHED', tags: 'leave,hr,approval' },
    { name: 'Invoice Processing', description: 'Accounts payable invoice receipt, verification, and payment', category: 'Finance', folderId: financeFolder.id, status: 'UNDER_REVIEW', tags: 'invoice,finance,payment' },
    { name: 'Change Management', description: 'Organizational change request, assessment, and implementation', category: 'Operations', folderId: opsFolder.id, status: 'DRAFT', tags: 'change,management,operations' },
    { name: 'Customer Complaint Handling', description: 'End-to-end customer complaint receipt, investigation, and resolution', category: 'Quality', folderId: opsFolder.id, status: 'PUBLISHED', tags: 'complaint,customer,quality' },
    { name: 'Budget Approval Workflow', description: 'Annual budget preparation, review, and approval process', category: 'Finance', folderId: financeFolder.id, status: 'DRAFT', tags: 'budget,finance,approval' },
  ];

  for (const processData of processes) {
    const process = await prisma.process.create({
      data: {
        id: crypto.randomUUID(),
        name: processData.name,
        description: processData.description,
        category: processData.category,
        status: processData.status,
        bpmnXml: sampleBpmnXml,
        folderId: processData.folderId,
        createdById: johnUser?.id || adminUser.id,
        tags: processData.tags,
        publishedAt: processData.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    // Create initial version
    await prisma.processVersion.create({
      data: {
        id: crypto.randomUUID(),
        processId: process.id,
        version: 1,
        bpmnXml: sampleBpmnXml,
        changelog: 'Initial version',
        createdById: johnUser?.id || adminUser.id,
      },
    });

    // Create publications for published processes
    if (processData.status === 'PUBLISHED') {
      await prisma.publication.create({
        data: {
          id: crypto.randomUUID(),
          processId: process.id,
          title: processData.name,
          description: processData.description,
          isPublic: true,
          publishedById: johnUser?.id || adminUser.id,
          viewCount: Math.floor(Math.random() * 100),
        },
      });
    }
  }

  console.log('Created sample processes');

  // Create sample governance workflow
  const workflow = await prisma.governanceWorkflow.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Standard Process Approval',
      description: 'Standard 3-step approval workflow for process changes',
      status: 'ACTIVE',
      steps: JSON.stringify([
        { name: 'Manager Review', description: 'Direct manager reviews the process changes', type: 'review', assigneeType: 'role', assigneeId: processManagerRole.id, timeoutDays: 5 },
        { name: 'Quality Check', description: 'Quality team verifies compliance', type: 'approval', assigneeType: 'role', assigneeId: analystRole.id, timeoutDays: 3 },
        { name: 'Final Approval', description: 'Governance manager gives final approval', type: 'approval', assigneeType: 'role', assigneeId: governanceManagerRole.id, timeoutDays: 7 },
      ]),
      triggerType: 'ON_PUBLISH',
      createdById: adminUser.id,
    },
  });

  await prisma.governanceWorkflow.create({
    data: {
      id: crypto.randomUUID(),
      name: 'Quick Review',
      description: 'Fast-track review for minor process updates',
      status: 'ACTIVE',
      steps: JSON.stringify([
        { name: 'Peer Review', description: 'A peer reviews the changes', type: 'review', assigneeType: 'role', assigneeId: analystRole.id, timeoutDays: 2 },
        { name: 'Manager Approval', description: 'Manager approves the changes', type: 'approval', assigneeType: 'role', assigneeId: processManagerRole.id, timeoutDays: 3 },
      ]),
      triggerType: 'MANUAL',
      createdById: adminUser.id,
    },
  });

  console.log('Created governance workflows');

  // Create sample dictionary entries
  const dictEntries = [
    { term: 'BPMN', definition: 'Business Process Model and Notation - a graphical representation for specifying business processes in a workflow.', category: 'Technical' },
    { term: 'Process Owner', definition: 'The person responsible for ensuring a process is performing as designed and for seeking improvement opportunities.', category: 'Business' },
    { term: 'SLA', definition: 'Service Level Agreement - a commitment between a service provider and a client defining the level of service expected.', category: 'Business' },
    { term: 'KPI', definition: 'Key Performance Indicator - a measurable value that demonstrates how effectively objectives are being achieved.', category: 'Business' },
    { term: 'Compliance', definition: 'Adherence to laws, regulations, guidelines, and specifications relevant to business operations.', category: 'Compliance' },
    { term: 'Gateway', definition: 'A BPMN element used to control the divergence and convergence of sequence flows in a process.', category: 'Technical' },
    { term: 'Swimlane', definition: 'A visual mechanism for organizing activities into categories in a process diagram, typically representing different roles or departments.', category: 'Technical' },
    { term: 'Process Instance', definition: 'A single execution of a process model, representing one specific case being handled through the process.', category: 'Technical' },
    { term: 'Escalation', definition: 'The act of raising an issue to a higher authority or priority level when it cannot be resolved at the current level.', category: 'Business' },
    { term: 'SOX Compliance', definition: 'Sarbanes-Oxley Act compliance - regulations for financial reporting accuracy and corporate governance.', category: 'Compliance' },
  ];

  for (const entry of dictEntries) {
    await prisma.dictionaryEntry.create({
      data: {
        id: crypto.randomUUID(),
        term: entry.term,
        definition: entry.definition,
        category: entry.category,
        createdById: adminUser.id,
      },
    });
  }

  console.log('Created dictionary entries');

  // Create sample audit logs
  const auditActions = [
    { action: 'CREATE', resource: 'process', resourceId: 'sample', details: '{"name":"Employee Onboarding"}' },
    { action: 'PUBLISH', resource: 'process', resourceId: 'sample', details: '{"name":"Purchase Order Approval"}' },
    { action: 'CREATE', resource: 'user', resourceId: 'sample', details: '{"email":"john.doe@processflow.com"}' },
    { action: 'UPDATE', resource: 'governance_workflow', resourceId: 'sample', details: '{"name":"Standard Process Approval"}' },
    { action: 'CREATE', resource: 'folder', resourceId: 'sample', details: '{"name":"HR Processes"}' },
  ];

  for (const log of auditActions) {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: adminUser.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        details: log.details,
        ipAddress: '127.0.0.1',
      },
    });
  }

  console.log('Created audit logs');
  console.log('\nSeeding complete!');
  console.log('\nDefault login credentials:');
  console.log('  Admin: admin@processflow.com / admin123');
  console.log('  User:  john.doe@processflow.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
