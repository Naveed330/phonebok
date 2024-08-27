import React, { useState, useEffect } from 'react';
import HomeNavbar from '../Components/navbar/Navbar';
import axios from 'axios';
import Select from 'react-select';
import { Table, Modal, Button, Container, Form } from 'react-bootstrap'
import { GrView } from 'react-icons/gr';

const CEOphoneBook = () => {
  const [ceoPhoneBookData, setCeoPhoneBookData] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewCommentModal, setShowViewCommentModal] = useState(false);
  const [commentsToView, setCommentsToView] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('phoneUserData'))?.token;
        if (!token) {
          throw new Error('Token not found');
        }

        // Fetch pipelines data
        const pipelinesResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/pipelines/get-pipelines`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setPipelines(pipelinesResponse.data.map(pipeline => ({
          value: pipeline._id,
          label: pipeline.name,
        })));

        // Fetch users data
        const usersResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/users/get-users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setUsers(usersResponse.data.map(user => ({
          value: user._id,
          label: user.name,
          pipeline: user.pipeline?._id // Ensure pipeline is included
        })));

        // Fetch phone book data
        const phoneBookResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/phonebook/get-all-phonebook`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setCeoPhoneBookData(phoneBookResponse.data);
        setFilteredData(phoneBookResponse.data);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Filter users based on the selected pipeline
    if (selectedPipeline) {
      const pipelineUsers = users.filter(user => user.pipeline === selectedPipeline.value);
      setFilteredUsers(pipelineUsers);
    } else {
      setFilteredUsers(users); // Show all users if no pipeline is selected
    }
  }, [selectedPipeline, users]);

  useEffect(() => {
    let filtered = ceoPhoneBookData;

    if (selectedPipeline) {
      // Filter by pipeline
      filtered = filtered.filter(entry => entry.pipeline === selectedPipeline.value);
    }

    if (selectedUser) {
      // Filter by user ID
      filtered = filtered.filter(entry => entry.user && entry.user._id === selectedUser.value);
    }

    if (searchQuery) {
      // Filter by number search query
      filtered = filtered.filter(entry => entry.number.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    setFilteredData(filtered);
  }, [selectedPipeline, selectedUser, searchQuery, ceoPhoneBookData]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const handleViewCommentsClick = (entry) => {
    handleViewComments(entry.comments);
  };

  const handleViewComments = (comments) => {
    setCommentsToView(comments);
    setShowViewCommentModal(true);
  };

  return (
    <>
      <HomeNavbar />
      <Container fluid >

        {/* Filter by pipeline */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '10px' }} className='mt-5'>
          <div className="filter-container w-100">
            <label htmlFor="pipeline-filter">Filter by Pipeline:</label>
            <Select
              id="pipeline-filter"
              value={selectedPipeline}
              onChange={setSelectedPipeline}
              options={[{ value: '', label: 'All Pipelines' }, ...pipelines]}
              isClearable
            />
          </div>

          {/* Filter by user */}
          <div className="filter-container w-100">
            <label htmlFor="user-filter">Filter by User:</label>
            <Select
              id="user-filter"
              value={selectedUser}
              onChange={setSelectedUser}
              options={[{ value: '', label: 'All Users' }, ...filteredUsers]}
              isClearable
            />
          </div>

          {/* Search by Number */}
          <Form.Group controlId="searchBarNumber" className='w-100'>
            <label htmlFor="user-filter">Search by Number:</label>
            <Form.Control
              type="text"
              placeholder="Search by Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Form.Group>
        </div>

        <Table striped bordered hover responsive className='mt-3'>
          <thead>
            <tr>
              <th className="equal-width">Number</th>
              <th className="equal-width">Status</th>
              <th className="equal-width">Call Status</th>
              <th className="equal-width">View Comments</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((entry, index) => (
                <tr key={index}>
                  <td style={{ textAlign: 'center' }} >{entry.number}</td>
                  <td style={{ textAlign: 'center' }}>{entry.status}</td>
                  <td style={{ textAlign: 'center' }}>{entry.calstatus}</td>
                  <td style={{ textAlign: 'center' }}>
                    <GrView
                      style={{ fontSize: '20px', cursor: 'pointer' }}
                      onClick={() => handleViewCommentsClick(entry)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No data available</td>
              </tr>
            )}
          </tbody>
        </Table >

        <Modal show={showViewCommentModal} onHide={() => setShowViewCommentModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>View Comments</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {commentsToView.length > 0 ? (
              <ul>
                {commentsToView.map((comment, index) => (
                  <li key={index}>{comment.remarks}</li>
                ))}
              </ul>
            ) : (
              <p>No Comments Available.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewCommentModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

      </Container>
    </>
  );
};

export default CEOphoneBook;
