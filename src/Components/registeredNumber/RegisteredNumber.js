import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import { Button, Container, Table, Form } from 'react-bootstrap';
import Select from 'react-select';
import './RegisteredNumber.css';
import { GrView } from 'react-icons/gr';
import HomeNavbar from '../navbar/Navbar';
import { MdOutlineAddCircle } from 'react-icons/md';
import ImportCSVForm from '../../Components/ImportCSv';

const RegisteredNumber = () => {
    const [pipelines, setPipelines] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [phonebookData, setPhonebookData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [show, setShow] = useState(false);
    const [showViewCommentModal, setShowViewCommentModal] = useState(false);
    const [commentsToView, setCommentsToView] = useState([]);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('phoneUserData'))?.token;
                if (!token) {
                    throw new Error('Token not found');
                }
                const pipelinesResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/pipelines/get-pipelines`);
                setPipelines(pipelinesResponse.data.map(pipeline => ({
                    value: pipeline._id,
                    label: pipeline.name,
                })));

                const usersResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/users/get-users`);
                setUsers(usersResponse.data.map(user => ({
                    value: user._id,
                    label: user.name,
                    pipeline: user.pipeline?._id,
                })));

                const phoneBookResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/phonebook/get-all-phonebook`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setPhonebookData(phoneBookResponse.data);
                setFilteredData(phoneBookResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (selectedPipeline) {
            const pipelineUsers = users.filter(user => user.pipeline === selectedPipeline.value);
            setFilteredUsers(pipelineUsers);
        } else {
            setFilteredUsers(users);
        }
    }, [selectedPipeline, users]);

    useEffect(() => {
        let filtered = phonebookData;

        if (selectedPipeline) {
            filtered = filtered.filter(entry => entry.pipeline === selectedPipeline.value);
        }

        if (selectedUser) {
            filtered = filtered.filter(entry => entry.user && entry.user._id === selectedUser.value);
        }

        if (searchQuery) {
            filtered = filtered.filter(entry => entry.number.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        setFilteredData(filtered);
    }, [selectedPipeline, selectedUser, searchQuery, phonebookData]);

    const handleViewCommentsClick = (entry) => {
        setCommentsToView(entry.comments || []);
        setShowViewCommentModal(true);
    };

    const handleCSVUpload = async (formData) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/phonebook/upload-csv`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert(response.data.message);
            handleClose();
        } catch (error) {
            console.error('Error uploading CSV:', error);
            alert('Error uploading CSV file.');
        }
    };

    if (!pipelines.length || !users.length) return <p>Loading...</p>;

    return (
        <>
            <HomeNavbar />
            <Container fluid>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }} className='mt-4'>
                    <h2>Phonebook Management</h2>
                    <Button variant="outline-success" onClick={handleShow}>
                        <MdOutlineAddCircle style={{ marginTop: '-2px' }} /> Import CSV
                    </Button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '10px' }} className='mt-3' >
                    <div className="filter-container w-100">
                        <label htmlFor="pipeline-filter">Filter by Pipeline:</label>
                        <Select
                            id="pipeline-filter"
                            options={pipelines}
                            value={selectedPipeline}
                            onChange={setSelectedPipeline}
                        />
                    </div>

                    <div className="filter-container w-100">
                        <label htmlFor="user-filter">Filter by User:</label>
                        <Select
                            id="user-filter"
                            options={filteredUsers}
                            value={selectedUser}
                            onChange={setSelectedUser}
                            isDisabled={!selectedPipeline}
                        />
                    </div>

                    <Form.Group controlId="search" className='w-100'>
                        <Form.Label className='mb-0'>Search by Number:</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by Number"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Form.Group>


                </div>

                <Table striped bordered hover className="mt-3">
                    <thead>
                        <tr>
                            <th className="equal-width">Number</th>
                            <th className="equal-width">Status</th>
                            <th className="equal-width">Call Status</th>
                            <th className="equal-width">View Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((entry) => (
                            <tr key={entry._id}>
                                <td style={{ textAlign: 'center' }}>{entry.number}</td>
                                <td style={{ textAlign: 'center' }}>{entry.status}</td>
                                <td style={{ textAlign: 'center' }}>{entry.calstatus}</td>
                                <td style={{ textAlign: 'center' }}>

                                    <GrView style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => handleViewCommentsClick(entry)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>

            {/* Import CSV Modal */}
            <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Import CSV</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ImportCSVForm
                        pipelines={pipelines}
                        users={users}
                        onSubmit={handleCSVUpload}
                    />
                </Modal.Body>
            </Modal>

            {/* View Comments Modal */}
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
            </Modal>
        </>
    );
};

export default RegisteredNumber;
