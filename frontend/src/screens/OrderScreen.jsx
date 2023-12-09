import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Row, Col, ListGroup, Image, Button, Card } from 'react-bootstrap';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { useSelector } from 'react-redux';
import Message from '../components/Message';
import Loader from '../components/Loader';
import {
  useUpdateOrderToPaidMutation,
  useGetPayPalClientIdQuery,
  useUpdateOrderToDeliveredMutation,
} from '../slices/ordersApiSlice';
import { useGetOrderByIdQuery } from '../slices/ordersApiSlice';
import { toast } from 'react-toastify';

const OrderScreen = () => {
  const { id: orderId } = useParams();

  const {
    data: order,
    refetch,
    isLoading,
    error,
  } = useGetOrderByIdQuery(orderId);

  const [payOrder, { isLoading: loadingPay }] = useUpdateOrderToPaidMutation();
  const [deliverOrder, { isLoading: loadingDeliver }] =
    useUpdateOrderToDeliveredMutation();

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  const {
    data: paypal,
    isLoading: loadingPayPal,
    error: errorPayPal,
  } = useGetPayPalClientIdQuery() || {};

  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (paypal) {
      if (!errorPayPal && loadingPayPal && paypal.clientId) {
        const loadPayPalScript = async () => {
          paypalDispatch({
            type: 'resetOptions',
            value: {
              'client-id': paypal.clientId,
              currency: 'USD',
            },
          });

          paypalDispatch({ type: 'setLoadingStatus', value: 'pending' });
        };

        if (order && !order.isPaid) {
          if (!window.paypal) {
            loadPayPalScript();
          }
        }
      }
    } else {
      console.log('paypal not loaded');
    }
  }, [
    paypal,
    errorPayPal,
    loadingPayPal,
    order,
    paypalDispatch,
    userInfo,
    refetch,
  ]);

  // function onApprove(data, actions) {
  //   return actions.order.capture().then(async function (details) {
  //     try {
  //       await payOrder({
  //         orderId,
  //         details,
  //       });
  //       refetch();
  //       toast.success('Order paid successfully');
  //     } catch (err) {
  //       toast.error(err?.data?.message || err.message);
  //     }
  //   });
  // }

  // function onError(err) {
  //   toast.error(err?.data?.message || err.message);
  // }

  async function onApproveTest() {
    await payOrder({
      orderId,
      details: { payer: {} },
    });
    toast.success('Order paid successfully');
    refetch();
  }

  // function createOrder(data, actions) {
  //   return actions.order
  //     .create({
  //       purchase_units: [
  //         {
  //           amount: {
  //             value: order.totalPrice,
  //           },
  //         },
  //       ],
  //     })
  //     .then((orderID) => {
  //       return orderID;
  //     });
  // }

  const deliverOrderHandler = async () => {
    try {
      await deliverOrder(orderId);
      toast.success('Order delivered successfully');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.message);
    }
  };

  return isLoading ? (
    <Loader />
  ) : error ? (
    <Message variant="danger" />
  ) : (
    <>
      <h1>Order {order._id}</h1>
      <Row>
        <Col md={8}>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong>
                {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address: </strong>
                {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant="success">
                  Delivered on {order.deliveredAt}
                </Message>
              ) : (
                <Message variant="danger">Not Delivered</Message>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <Message variant="success">Paid on {order.paidAt}</Message>
              ) : (
                <Message variant="danger">Not Paid</Message>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant="flush">
                  {order.orderItems.map((item, index) => (
                    <ListGroup.Item key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          ></Image>
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} * ${item.price} = $
                          {(item.qty * item.price).toFixed(2)}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </ListGroup.Item>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card className="p-3">
            <ListGroup variant="flush">
              <ListGroup.Item>
                <h2>Order Summary</h2>
              </ListGroup.Item>
            </ListGroup>
            <ListGroup.Item>
              <Row>
                <Col>Items:</Col>
                <Col>${order.itemsPrice}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col>Shipping:</Col>
                <Col>${order.shippingPrice}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col>Tax:</Col>
                <Col>${order.taxPrice}</Col>
              </Row>
            </ListGroup.Item>
            <ListGroup.Item>
              <Row>
                <Col>Total:</Col>
                <Col>${order.totalPrice}</Col>
              </Row>
            </ListGroup.Item>

            {error && (
              <ListGroup.Item>
                <Message variant="danger">{error}</Message>
              </ListGroup.Item>
            )}

            {!order.isPaid && (
              <ListGroup.Item>
                {loadingPay && <Loader />}
                {isPending ? (
                  '<Loader />'
                ) : (
                  <div>
                    <Button
                      onClick={onApproveTest}
                      style={{ marginBottom: '10px' }}
                    >
                      Test Pay Order
                    </Button>

                    {/* TODO */}
                  </div>
                )}

                {!order.isPaid && (
                  <ListGroup.Item>
                    {loadingPay && <Loader />}
                    {!order.isPaid && (
                      <>
                        {isPending ? (
                          <Loader />
                        ) : (
                          <PayPalButtons
                            style={{ layout: 'horizontal' }}
                            createOrder={(data, actions) => {
                              return actions.order.create({
                                purchase_units: [
                                  {
                                    amount: {
                                      value: order.totalPrice,
                                    },
                                  },
                                ],
                              });
                            }}
                            onApprove={async (data, actions) => {
                              const orderResult = await actions.order.capture();
                              payOrder({
                                orderId: order._id,
                                paymentResult: {
                                  id: orderResult.id,
                                  status: orderResult.status,
                                  update_time: orderResult.update_time,
                                  email_address:
                                    orderResult.payer.email_address,
                                },
                              });
                              toast.success('Order paid successfully');
                              refetch();
                            }}
                            onError={(err) => {
                              toast.error(err);
                            }}
                          />
                        )}
                      </>
                    )}
                  </ListGroup.Item>
                )}
              </ListGroup.Item>
            )}
            {loadingDeliver && <Loader />}
            {userInfo &&
              userInfo.isAdmin &&
              order.isPaid &&
              !order.isDelivered && (
                <ListGroup.Item>
                  <Button
                    type="button"
                    className="btn btn-block"
                    onClick={deliverOrderHandler}
                  >
                    Mark As Delivered
                  </Button>
                </ListGroup.Item>
              )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OrderScreen;
