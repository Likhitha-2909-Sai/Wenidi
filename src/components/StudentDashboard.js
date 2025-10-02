import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import {
  Layout,
  Button,
  Card,
  Table,
  message,
  Row,
  Col,
  Statistic,
  Tag,
  Alert,
  Spin,
  Form,
  Input,
  Modal
} from 'antd';
import {
  LogoutOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ReloadOutlined,
  UserOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import axios from 'axios';
import moment from 'moment';

const { Header, Content } = Layout;

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { connected, account, disconnect } = useWallet();
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    attendancePercentage: 0
  });

  // Aptos configuration
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);
  const MODULE_ADDRESS = "0x1"; // Replace with your deployed contract address
  const MODULE_NAME = "attendance_system";
  const ADMIN_ADDRESS = "0x1"; // Replace with admin's address

  useEffect(() => {
    if (!connected) {
      navigate('/login');
      return;
    }
    loadStudentData();
  }, [connected, navigate, account]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkStudentRegistration(),
        fetchAttendanceRecords(),
        checkTodayAttendance()
      ]);
    } catch (error) {
      console.error('Error loading student data:', error);
      message.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const checkStudentRegistration = async () => {
    try {
      // Import dataService functions
      const { isStudentRegistered, getStudentByWallet } = await import('../utils/dataService');
      const registered = isStudentRegistered(account?.address);
      setIsRegistered(registered);
      
      if (registered) {
        const student = getStudentByWallet(account?.address);
        setStudentInfo(student);
      } else {
        // Show registration modal for unregistered students
        setShowRegistrationModal(true);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      setIsRegistered(false);
      setShowRegistrationModal(true);
    }
  };

  const handleSelfRegistration = async (values) => {
    try {
      setLoading(true);
      
      // Import dataService functions
      const { addStudent } = await import('../utils/dataService');
      
      const studentData = {
        id: values.studentId,
        name: values.name,
        email: values.email,
        student_address: account?.address
      };

      const newStudent = addStudent(studentData);
      setStudentInfo(newStudent);
      setIsRegistered(true);
      setShowRegistrationModal(false);
      
      message.success('Registration successful! You can now mark attendance.');
      form.resetFields();
      
      // Reload data
      await loadStudentData();
      
    } catch (error) {
      console.error('Error during self registration:', error);
      message.error('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      // Import dataService functions
      const { getStudentAttendance } = await import('../utils/dataService');
      const records = getStudentAttendance(account?.address);
      setAttendanceRecords(records);
      
      // Calculate statistics
      const presentDays = records.filter(record => record.status === 'present').length;
      const totalDays = records.length;
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
      
      setStats({
        totalDays,
        presentDays,
        attendancePercentage
      });
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = moment().format('YYYY-MM-DD');
      // Import dataService functions
      const { isAttendanceMarkedToday } = await import('../utils/dataService');
      const marked = isAttendanceMarkedToday(account?.address, today);
      setAttendanceMarked(marked);
    } catch (error) {
      console.error('Error checking today attendance:', error);
      setAttendanceMarked(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!isRegistered) {
      message.error('Please complete registration first.');
      return;
    }

    try {
      setLoading(true);
      const today = moment().format('YYYY-MM-DD');
      
      // Import dataService functions
      const { markAttendance } = await import('../utils/dataService');
      
      // Mark attendance using data service
      await markAttendance(account?.address, today);
      
      setAttendanceMarked(true);
      message.success('Attendance marked successfully!');
      
      // Refresh data
      await loadStudentData();
      
    } catch (error) {
      console.error('Error marking attendance:', error);
      message.error('Failed to mark attendance: ' + error.message);
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

  const attendanceColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('MMM DD, YYYY'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      defaultSortOrder: 'descend'
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
          <CheckCircleOutlined style={{ marginRight: '4px' }} />
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Day',
      dataIndex: 'date',
      key: 'day',
      render: (date) => moment(date).format('dddd')
    }
  ];

  if (!connected) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }} />;
  }

  return (
    <Layout className="dashboard-container">
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="logo">WENIDI - Student Portal</div>
          <div className="user-info">
            <span>Welcome, {studentInfo?.name || 'Student'}</span>
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
        {/* Registration Status Alert */}
        {!isRegistered && (
          <Alert
            message="Registration Required"
            description="Please complete your registration to start marking attendance."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
            action={
              <Button size="small" onClick={() => setShowRegistrationModal(true)}>
                Register Now
              </Button>
            }
          />
        )}

        {/* Student Info Card */}
        {isRegistered && studentInfo && (
          <Card style={{ marginBottom: '24px' }}>
            <h4>📋 Student Information</h4>
            <Row gutter={[16, 8]}>
              <Col span={12}><strong>Student ID:</strong> {studentInfo.id}</Col>
              <Col span={12}><strong>Name:</strong> {studentInfo.name}</Col>
              <Col span={12}><strong>Email:</strong> {studentInfo.email}</Col>
              <Col span={12}><strong>Registration Date:</strong> {moment(studentInfo.created_at).format('MMM DD, YYYY')}</Col>
            </Row>
          </Card>
        )}

        {/* Statistics Row */}
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Attendance Percentage"
                value={stats.attendancePercentage}
                suffix="%"
                prefix={<UserOutlined />}
                valueStyle={{ color: stats.attendancePercentage >= 75 ? '#52c41a' : '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Present Days"
                value={stats.presentDays}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card className="stat-card">
              <Statistic
                title="Total Days"
                value={stats.totalDays}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Mark Attendance Section */}
        <Row gutter={[16, 16]} className="action-cards">
          <Col xs={24} lg={12}>
            <Card className="action-card">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <ClockCircleOutlined className="card-icon" style={{ color: '#1890ff' }} />
                <h3>Mark Today's Attendance</h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  {moment().format('dddd, MMMM DD, YYYY')}
                </p>
                <Button
                  type="primary"
                  size="large"
                  className={`attendance-button ${attendanceMarked ? 'attendance-success' : ''}`}
                  onClick={handleMarkAttendance}
                  loading={loading}
                  disabled={!isRegistered || attendanceMarked}
                  icon={attendanceMarked ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                >
                  {attendanceMarked ? 'Attendance Marked!' : 'Mark Attendance'}
                </Button>
                {attendanceMarked && (
                  <p style={{ color: '#52c41a', marginTop: '12px', fontSize: '14px' }}>
                    ✓ You have successfully marked your attendance for today
                  </p>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="action-card">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <ReloadOutlined className="card-icon" style={{ color: '#722ed1' }} />
                <h3>Refresh Data</h3>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Update your attendance records
                </p>
                <Button
                  size="large"
                  onClick={loadStudentData}
                  loading={loading}
                  style={{ height: '48px', minWidth: '150px' }}
                >
                  Refresh
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Attendance History Table */}
        <Card className="table-container">
          <div className="table-header">
            <h3 className="table-title">My Attendance History</h3>
          </div>
          <Table
            columns={attendanceColumns}
            dataSource={attendanceRecords}
            loading={loading}
            rowKey={(record) => `${record.date}_${record.timestamp}`}
            pagination={{ 
              pageSize: 10,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`
            }}
            scroll={{ x: true }}
            locale={{
              emptyText: isRegistered ? 'No attendance records found' : 'Please complete registration to view records'
            }}
          />
        </Card>

        {/* Attendance Guidelines */}
        <Card style={{ marginTop: '24px' }}>
          <h4>📋 Attendance Guidelines</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>Complete registration with your details before marking attendance</li>
            <li>Attendance can only be marked once per day</li>
            <li>Make sure your wallet is connected before marking attendance</li>
            <li>Attendance is recorded securely and can be viewed by administrators</li>
            <li>Minimum 75% attendance is typically required</li>
          </ul>
        </Card>
      </Content>

      {/* Student Registration Modal */}
      <Modal
        title="Student Registration"
        open={showRegistrationModal}
        onCancel={() => setShowRegistrationModal(false)}
        footer={null}
        width={600}
        closable={false}
      >
        <Alert
          message="Welcome to WENIDI!"
          description="Please fill in your details to complete registration and start marking attendance."
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <Form
          form={form}
          onFinish={handleSelfRegistration}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="studentId"
            label="Student ID"
            rules={[{ required: true, message: 'Please enter your student ID' }]}
          >
            <Input placeholder="e.g., STU001, 2023001, etc." />
          </Form.Item>

          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="e.g., John Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="e.g., john.doe@example.com" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              <UserAddOutlined /> Complete Registration
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            <strong>Your Wallet Address:</strong><br/>
            {account?.address}
          </p>
        </div>
      </Modal>
    </Layout>
  );
};

export default StudentDashboard;