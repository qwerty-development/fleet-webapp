const DealerDetails: React.FC = () => {
  return (
    <div>
      <div className="bg-[#151515] pl-3 md:pl-32 pr-2 py-20 flex flex-col md:flex-row">
        <div className="flex  pb-10 md:pb-0 flex-col ">
          <h2 className="text-4xl md:text-6xl font-bold mb-3">
            Dealer's {""}
            <span className="text-accent font-bold bg-white/5 rounded-md p-1">
              Haven
            </span>
          </h2>
          <h3 className="text-xl md:text-3xl text-white/85">
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Deserunt,dolorum?
          </h3>
        </div>
        <div className="flex space-x-2 md:space-x-5 justify-end">
          <img
            src="showcase/browsing.png"
            alt="test phone pic"
            className="h-96 md:h-[700px] rounded-3xl opacity-20 md:opacity-100"
          />
          <img
            src="showcase/authentication.png"
            alt="test phone pic"
            className="h-96 md:h-[700px] rounded-3xl"
          />
          <img
            src="showcase/dealership.png"
            alt="test phone pic"
            className="h-96 md:h-[700px] rounded-3xl"
          />
        </div>
      </div>
    </div>
  );
};

export default DealerDetails;
