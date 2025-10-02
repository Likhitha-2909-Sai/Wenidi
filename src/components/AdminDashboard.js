import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import {
  Layout,
  Button,
  Card,
  Table,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Spin
} from 'antd';
import {
  LogoutOutlined,
  UserAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import axios from 'axios';
import moment from 'moment';

const { Header, Content } = Layout;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { connected, account, disconnect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    totalRecords: 0
  });

  // Aptos configuration
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);
  const MODULE_ADDRESS = "d0fdbd797a8aab8469bc90b1226aee6b4705763ebd2b4791f2953136c5c9bccc"; // Replace with your deployed contract address
  const MODULE_NAME = "attendance_system";

  useEffect(() => {
    if (!connected) {
      navigate('/login');
      return;
    }
    loadData();
  }, [connected, navigate, account]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStudents(),
        fetchAttendanceRecords()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Import dataService functions
      const { getStudents } = await import('../utils/dataService');
      const studentsData = getStudents();
      setStudents(studentsData);
      setStats(prev => ({
        ...prev,
        totalStudents: studentsData.length
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      // Import dataService functions
      const { getAttendanceRecords, getAttendanceStats } = await import('../utils/dataService');
      const attendanceData = getAttendanceRecords();
      const statsData = getAttendanceStats();
      
      setAttendanceRecords(attendanceData);
      setStats(prev => ({
        ...prev,
        presentToday: statsData.presentToday,
        totalRecords: statsData.totalRecords
      }));
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const handleAddStudent = async (values) => {
    try {
      setLoading(true);
      
      // Import dataService functions
      const { addStudent } = await import('../utils/dataService');
      
      const studentData = {
        id: values.studentId,
        name: values.name,
        email: values.email,
        student_address: values.walletAddress,
        registration_type: 'admin'
      };

      const newStudent = addStudent(studentData);
      
      message.success('Student registered successfully!');
      setIsModalVisible(false);
      form.resetFields();
      
      // Refresh data
      await loadData();
      
    } catch (error) {
      console.error('Error registering student:', error);
      message.error('Failed to register student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await disconnect();
      navigate('/login');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const studentColumns = [
    {
      title: 'Student ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Wallet Address',
      dataIndex: 'student_address',
      key: 'student_address',
      render: (address) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {`${address.slice(0, 8)}...${address.slice(-8)}`}
        </span>
      )
    },
    {
      title: 'Registration Type',
      dataIndex: 'registration_type',
      key: 'registration_type',
      render: (type) => (
        <Tag color={type === 'self' ? 'blue' : 'green'}>
          {type === 'self' ? 'Self Registered' : 'Admin Registered'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    }
  ];

  const attendanceColumns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Student Name',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (name, record) => <strong>{name || 'Unknown Student'}</strong>
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment.unix(timestamp).format('HH:mm:ss A')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'present' ? 'green' : 'red'} className="status-tag">
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Student Address',
      dataIndex: 'student_address',
      key: 'student_address',
      render: (address) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {`${address.slice(0, 8)}...${address.slice(-8)}`}
        </span>
      )
    }
  ];

  if (!connected) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />;
  }

  return (
    <Layout className="dashboard-container">
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="logo">WENIDI - Admin Panel</div>
          <div className="user-info">
            <span>Connected as Admin</span>
            <span className="wallet-address">
              {account?.address?.slice(0, 8)}...{account?.address?.slice(-8)}
            </span>
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              type="text"
            >
              Logout
            </Button>
          </div>
        </div>
      </Header>

      <Content className="dashboard-content">
        {/* Statistics Row */}
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Total Students"
                value={stats.totalStudents}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Present Today"
                value={stats.presentToday}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Total Records"
                value={stats.totalRecords}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsModalVisible(true)}
              size="large"
            >
              Add Student
            </Button>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
              size="large"
            >
              Refresh Data
            </Button>
          </Col>
        </Row>

        {/* Students Table */}
        <Card className="table-container" style={{ marginBottom: '24px' }}>
          <div className="table-header">
            <h3 className="table-title">Registered Students</h3>
          </div>
          <Table
            columns={studentColumns}
            dataSource={students}
            loading={loading}
            rowKey="student_address"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>

        {/* Attendance Records Table */}
        <Card className="table-container">
          <div className="table-header">
            <h3 className="table-title">Attendance Records</h3>
          </div>
          <Table
            columns={attendanceColumns}
            dataSource={attendanceRecords}
            loading={loading}
            rowKey={(record) => `${record.student_address}_${record.timestamp}`}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>
      </Content>

      {/* Add Student Modal */}
      <Modal
        title="Register New Student"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          onFinish={handleAddStudent}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="studentId"
            label="Student ID"
            rules={[{ required: true, message: 'Please enter student ID' }]}
          >
            <Input placeholder="e.g., STU001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter student name' }]}
          >
            <Input placeholder="e.g., John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="e.g., john.doe@example.com" />
          </Form.Item>

          <Form.Item
            name="walletAddress"
            label="Wallet Address"
            rules={[{ required: true, message: 'Please enter wallet address' }]}
          >
            <Input placeholder="0x..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Register Student
              </Button>
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;